export type ApiError = {
  success: false;
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
  requirements?: Record<string, unknown>;
};

// ─── Constants ───────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 30_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 1_000;
const RETRYABLE_STATUSES = new Set([502, 503, 504, 408]);

// ─── Zepargn hosts (primary + fallback) ─────────────────────────────────
// Le backend Zepargn expose deux endpoints. On tente le primary d'abord ;
// si la connexion échoue (réseau, timeout, reset), on bascule sur le LB.
// Pour le dev local (proxy Vite), on court-circuite sur '/v2/api'.

const ZEPARGN_HOSTS = [
  'https://prodapi.zepargn.com',
  'https://api-lb.livezepargn.net',
];

// ─── Token helpers ───────────────────────────────────────────────────────

import {
  getToken,
  clearAuthStorage,
  broadcastLogout,
} from '../lib/authStorage';

// ─── Auth helpers ────────────────────────────────────────────────────────
// Pas d'endpoint /auth/refresh-token côté Zepargn — on re-login sur 401.

function forceLogout() {
  broadcastLogout();
  clearAuthStorage();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:force-logout'));
  }
}

// ─── Fetch with timeout ──────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw { success: false, message: 'La requête a expiré. Vérifiez votre connexion.' } as ApiError;
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// ─── Sleep (for retry backoff) ───────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Host resolution with fallback ──────────────────────────────────────
// Construit l'URL finale. Si le path commence par 'http', il est utilisé tel quel.
// Sinon, on tente les hosts Zepargn en séquence (primary → LB fallback).
// En dev avec proxy Vite, path reste relatif ('/v2/api/...').

const NETWORK_ERRORS = new Set(['ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']);

async function fetchWithFallback(
  path: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  if (path.startsWith('http')) {
    return fetchWithTimeout(path, options, timeout);
  }

  // Relative path → try each Zepargn host in order
  let lastNetworkError: any;
  for (const host of ZEPARGN_HOSTS) {
    const url = host + path;
    try {
      return await fetchWithTimeout(url, options, 5000);
    } catch (err: any) {
      // Only fall through on network-level failures
      if (
        NETWORK_ERRORS.has(err?.code) ||
        err?.name === 'AbortError' ||
        err?.message?.includes('fetch')
      ) {
        lastNetworkError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastNetworkError ?? { success: false, message: 'Tous les serveurs sont inaccessibles.' };
}

// ─── Main API request (timeout + host fallback + retry + 429 + 401) ─────

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; timeout?: number; retries?: number } = {}
): Promise<T> {
  const { skipAuth, timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithFallback(path, { ...fetchOptions, headers }, timeout);

      const ct = res.headers.get('content-type');
      const body: any = ct && ct.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};

      if (res.ok) return body as T;

      // ── 401: JWT expiré → re-login (pas de refresh endpoint) ────
      if (res.status === 401 && !skipAuth) {
        forceLogout();
        lastError = {
          success: false,
          message: body?.message || body?.msg || 'Session expirée. Veuillez vous reconnecter.',
          code: body?.code,
          status: 401,
        } as ApiError;
        break;
      }

      // ── 429: respecte le Retry-After avant de réessayer ─────────
      if (res.status === 429 && attempt < retries) {
        const retryAfter = res.headers.get('Retry-After');
        const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : RETRY_DELAY_BASE * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }

      // ── 5xx retryable (502, 503, 504, 408) ──────────────────────
      if (RETRYABLE_STATUSES.has(res.status) && attempt < retries) {
        await sleep(RETRY_DELAY_BASE * Math.pow(2, attempt));
        continue;
      }

      // ── Erreur non-retryable ─────────────────────────────────────
      lastError = {
        success: false,
        message: body?.message || body?.msg || body?.error || `Erreur ${res.status}`,
        code: body?.code,
        status: res.status,
        errors: body?.errors,
        requirements: body?.requirements,
      } as ApiError;
      break;

    } catch (err: any) {
      if (attempt < retries && !err?.success) {
        await sleep(RETRY_DELAY_BASE * Math.pow(2, attempt));
        lastError = err;
        continue;
      }
      lastError = err?.success === false
        ? err
        : { success: false, message: err?.message || 'Erreur réseau. Vérifiez votre connexion.' };
      break;
    }
  }

  throw lastError;
}

// ─── Multipart (file uploads) ────────────────────────────────────────────

export async function apiRequestMultipart<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetchWithFallback(path, { method: 'POST', headers, body: formData }, REQUEST_TIMEOUT);

  const ct = res.headers.get('content-type');
  const body: any = ct && ct.includes('application/json')
    ? await res.json().catch(() => ({}))
    : {};

  if (!res.ok) {
    throw { success: false, message: body?.message || body?.msg || `Erreur ${res.status}` };
  }
  return body as T;
}

// ─── Raw request (no throw on specific status) ──────────────────────────

export async function apiRequestRaw(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<{ res: Response; body: any }> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetchWithFallback(path, { ...fetchOptions, headers }, REQUEST_TIMEOUT);
  const ct = res.headers.get('content-type');
  const body: any = ct && ct.includes('application/json')
    ? await res.json().catch(() => ({}))
    : {};
  return { res, body };
}
