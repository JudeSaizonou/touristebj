export type ApiError = {
  success: false;
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
  requirements?: Record<string, unknown>;
};

// ─── Constants ───────────────────────────────────────────────────────────

const REQUEST_TIMEOUT = 30_000; // 30s default timeout
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 1_000; // 1s base for exponential backoff
const RETRYABLE_STATUSES = new Set([502, 503, 504, 408]);

// ─── Token helpers ───────────────────────────────────────────────────────

import {
  getToken,
  getRefreshToken,
  setToken as storageSetToken,
  setRefreshToken as storageSetRefreshToken,
  clearAuthStorage,
} from '../lib/authStorage';

// ─── Token refresh (singleton promise — prevents race conditions) ────────

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  // If a refresh is already in flight, reuse the same promise
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
      const res = await fetch('/v2/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return false;
      const body = await res.json();
      if (body?.token) {
        storageSetToken(body.token);
        if (body.refreshToken) storageSetRefreshToken(body.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
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

// ─── Main API request (with timeout + retry + token refresh) ─────────────

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; timeout?: number; retries?: number } = {}
): Promise<T> {
  const { skipAuth, timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${path}`;
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
      const res = await fetchWithTimeout(url, { ...fetchOptions, headers }, timeout);

      const ct = res.headers.get('content-type');
      const body: any = ct && ct.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};

      if (res.ok) return body as T;

      // ── 401: try token refresh once ──────────────────────────────
      if (res.status === 401 && !skipAuth) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          const newToken = getToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryRes = await fetchWithTimeout(url, { ...fetchOptions, headers }, timeout);
            const retryCt = retryRes.headers.get('content-type');
            const retryBody = retryCt && retryCt.includes('application/json')
              ? await retryRes.json().catch(() => ({}))
              : {};
            if (retryRes.ok) return retryBody as T;

            // The retry reached the server. If the server still says 401,
            // the refreshed token is not valid either — fall through to
            // force-logout. Otherwise the session is fine and we surface
            // the retry's actual error (validation, conflict, 5xx…) so the
            // user keeps working instead of being kicked out.
            if (retryRes.status !== 401) {
              lastError = {
                success: false,
                message: retryBody?.message || retryBody?.msg || retryBody?.error || `Erreur ${retryRes.status}`,
                code: retryBody?.code,
                status: retryRes.status,
                errors: retryBody?.errors,
                requirements: retryBody?.requirements,
              } as ApiError;
              break;
            }
          }
        }
        // Refresh failed or retry still 401 — force logout
        clearAuthStorage();
        window.dispatchEvent(new CustomEvent('auth:force-logout'));
      }

      // ── Retryable server errors (502, 503, 504, 408) ────────────
      if (RETRYABLE_STATUSES.has(res.status) && attempt < retries) {
        await sleep(RETRY_DELAY_BASE * Math.pow(2, attempt));
        continue;
      }

      // ── Non-retryable error ─────────────────────────────────────
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
      // Network error — retry with backoff
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

  const res = await fetchWithTimeout(path, { method: 'POST', headers, body: formData });

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
  const url = path.startsWith('http') ? path : `${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetchWithTimeout(url, { ...fetchOptions, headers });
  const ct = res.headers.get('content-type');
  const body: any = ct && ct.includes('application/json')
    ? await res.json().catch(() => ({}))
    : {};
  return { res, body };
}
