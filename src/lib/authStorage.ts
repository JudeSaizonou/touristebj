// Central helper for authenticated session state.
//
// Tokens and user state live in sessionStorage (scoped per-tab) instead of
// localStorage so a stolen token via XSS dies with the tab and cannot be
// lifted by a script that loads later in a different page. This is the
// pragmatic middle ground while HttpOnly cookies are not yet available
// on the backend.

const TOKEN_KEY = 'touriste_token';
const REFRESH_KEY = 'touriste_refresh';
const USER_KEY = 'touriste_user';

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function setRefreshToken(refreshToken: string) {
  try {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {}
}

export function getStoredUser<T = any>(): T | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown) {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearAuthStorage() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    // Also wipe any legacy localStorage values from older builds.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// One-shot migration for users coming from the previous build where tokens
// lived in localStorage. Runs on app boot, copies over any legacy values, and
// deletes them so a future XSS cannot harvest them from localStorage.
export function migrateLegacyAuthStorage() {
  try {
    const legacyToken = localStorage.getItem(TOKEN_KEY);
    const legacyRefresh = localStorage.getItem(REFRESH_KEY);
    const legacyUser = localStorage.getItem(USER_KEY);

    if (legacyToken && !sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, legacyToken);
    }
    if (legacyRefresh && !sessionStorage.getItem(REFRESH_KEY)) {
      sessionStorage.setItem(REFRESH_KEY, legacyRefresh);
    }
    if (legacyUser && !sessionStorage.getItem(USER_KEY)) {
      sessionStorage.setItem(USER_KEY, legacyUser);
    }

    if (legacyToken || legacyRefresh || legacyUser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
}
