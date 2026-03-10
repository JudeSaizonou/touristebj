export type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  requirements?: Record<string, unknown>;
};

function getToken(): string | null {
  return localStorage.getItem('touriste_token');
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
    if (res.status === 401) {
      localStorage.removeItem('touriste_token');
      localStorage.removeItem('touriste_user');
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
