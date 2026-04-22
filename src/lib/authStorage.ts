// Central helper for authenticated session state.
//
// Tokens and user state live in sessionStorage (scoped per-tab) instead of
// localStorage so a stolen token via XSS dies with the tab and cannot be
// lifted by a script that loads later in a different page. This is the
// pragmatic middle ground while HttpOnly cookies are not yet available
// on the backend.
//
// Cross-tab coordination: sessionStorage is per-tab, but the backend's
// refresh-token reuse detection is per-user. When a user opens a second
// tab (especially via "Duplicate tab" which copies sessionStorage), the
// two tabs start with the same refresh token and a refresh race will
// trigger a global kill-switch. To avoid that we broadcast rotations and
// logouts via BroadcastChannel, and (in client.ts) serialize refresh
// attempts via navigator.locks so only one tab ever hits the backend.

const TOKEN_KEY = 'touriste_token';
const REFRESH_KEY = 'touriste_refresh';
const USER_KEY = 'touriste_user';

type AuthMessage =
  | { type: 'tokens-updated'; token: string; refreshToken?: string }
  | { type: 'logout' };

let channel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('zepargn-auth');
    channel.addEventListener('message', (e: MessageEvent<AuthMessage>) => {
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'tokens-updated') {
        // Sibling tab rotated the token pair — mirror it locally so our
        // next request uses a valid token and we don't race by replaying
        // the now-revoked refresh token.
        try {
          sessionStorage.setItem(TOKEN_KEY, msg.token);
          if (msg.refreshToken) sessionStorage.setItem(REFRESH_KEY, msg.refreshToken);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:tokens-synced', { detail: { token: msg.token } }));
          }
        } catch {}
      } else if (msg.type === 'logout') {
        // Sibling tab was forced out — tear down this tab too so the user
        // isn't stuck on a dead session in an inactive tab.
        try {
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(REFRESH_KEY);
          sessionStorage.removeItem(USER_KEY);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:force-logout'));
          }
        } catch {}
      }
    });
  }
} catch {
  channel = null;
}

export function broadcastTokensUpdate(token: string, refreshToken?: string) {
  try {
    channel?.postMessage({ type: 'tokens-updated', token, refreshToken });
  } catch {}
}

export function broadcastLogout() {
  try {
    channel?.postMessage({ type: 'logout' });
  } catch {}
}

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
