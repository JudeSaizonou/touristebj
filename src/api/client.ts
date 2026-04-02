export type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  requirements?: Record<string, unknown>;
};

function getToken(): string | null {
  return localStorage.getItem('touriste_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('touriste_refresh');
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
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
        localStorage.setItem('touriste_token', body.token);
        if (body.refreshToken) localStorage.setItem('touriste_refresh', body.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (!skipAuth && token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers || {}) },
  });

  let body: any;
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) {
    body = await res.json().catch(() => ({}));
  } else {
    body = {};
  }

  if (!res.ok) {
    // On 401, try to refresh token once before giving up
    if (res.status === 401 && !skipAuth) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
        const newToken = getToken();
        if (newToken) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          const retryRes = await fetch(url, { ...fetchOptions, headers: { ...headers, ...(fetchOptions.headers || {}) } });
          const retryCt = retryRes.headers.get('content-type');
          const retryBody = retryCt && retryCt.includes('application/json')
            ? await retryRes.json().catch(() => ({}))
            : {};
          if (retryRes.ok) return retryBody as T;
        }
      }
      // Refresh failed — clear auth and force logout
      localStorage.removeItem('touriste_token');
      localStorage.removeItem('touriste_refresh');
      localStorage.removeItem('touriste_user');
      window.dispatchEvent(new CustomEvent('auth:force-logout'));
    }
    const err: ApiError = {
      success: false,
      message: body?.message || body?.msg || body?.error || `Erreur ${res.status}`,
      errors: body?.errors,
      requirements: body?.requirements,
    };
    throw err;
  }

  return body as T;
}

/** Appel multipart/form-data — ne pas définir Content-Type (le browser l'ajoute avec le boundary). */
export async function apiRequestMultipart<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { method: 'POST', headers, body: formData });
  let body: any;
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) {
    body = await res.json().catch(() => ({}));
  } else {
    body = {};
  }
  if (!res.ok) {
    throw { success: false, message: body?.message || body?.msg || `Erreur ${res.status}` };
  }
  return body as T;
}

/** Appel fetch sans throw sur certains status (ex: 409). Retourne { res, body }. */
export async function apiRequestRaw(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<{ res: Response; body: any }> {
  const { skipAuth, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (!skipAuth && token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...fetchOptions, headers: { ...headers, ...(fetchOptions.headers || {}) } });
  let body: any;
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) {
    body = await res.json().catch(() => ({}));
  } else {
    body = {};
  }
  return { res, body };
}
