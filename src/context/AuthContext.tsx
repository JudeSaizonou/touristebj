import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AuthUser } from '../api/auth';
import {
  getToken as storageGetToken,
  getRefreshToken as storageGetRefreshToken,
  setToken as storageSetToken,
  setRefreshToken as storageSetRefreshToken,
  getStoredUser,
  setStoredUser,
  clearAuthStorage,
  migrateLegacyAuthStorage,
  broadcastLogout,
} from '../lib/authStorage';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, user: AuthUser, refreshToken?: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): { token: string | null; user: AuthUser | null } {
  const token = storageGetToken();
  const user = getStoredUser<AuthUser>();
  return { token, user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    ready: false,
  });

  useEffect(() => {
    // Move any legacy localStorage values into sessionStorage before reading.
    migrateLegacyAuthStorage();
    const { token, user } = readStored();
    setState({ token, user, ready: true });
  }, []);

  // Listen for forced logout (e.g. expired token, failed refresh, or a
  // sibling tab broadcasting a logout).
  useEffect(() => {
    const handleForceLogout = () => {
      setState({ token: null, user: null, ready: true });
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => window.removeEventListener('auth:force-logout', handleForceLogout);
  }, []);

  // Listen for a sibling tab rotating the token pair — keep our in-memory
  // token in sync with the value already written to sessionStorage by the
  // broadcast listener in authStorage.ts. Without this, our React state
  // would keep serving the stale token until a full reload.
  useEffect(() => {
    const handleTokensSynced = (e: Event) => {
      const detail = (e as CustomEvent<{ token?: string }>).detail;
      if (!detail?.token) return;
      setState(prev => (prev.token === detail.token ? prev : { ...prev, token: detail.token! }));
    };
    window.addEventListener('auth:tokens-synced', handleTokensSynced as EventListener);
    return () => window.removeEventListener('auth:tokens-synced', handleTokensSynced as EventListener);
  }, []);

  const logoutInProgress = useRef(false);

  const setAuth = useCallback((token: string, user: AuthUser, refreshToken?: string) => {
    storageSetToken(token);
    setStoredUser(user);
    if (refreshToken) storageSetRefreshToken(refreshToken);
    setState({ token, user, ready: true });
  }, []);

  const logout = useCallback(async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    // Invalidate token server-side
    const refreshToken = storageGetRefreshToken();
    const token = storageGetToken();
    if (token) {
      try {
        await fetch('/v2/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refreshToken: refreshToken || undefined }),
        });
      } catch {
        // Ignore network errors during logout
      }
    }
    clearAuthStorage();
    // Sibling tabs (e.g. "Duplicate tab" case) should also tear down so
    // they don't keep replaying the now-invalid refresh token.
    broadcastLogout();
    setState({ token: null, user: null, ready: true });
    logoutInProgress.current = false;
  }, []);

  const isAdmin = Boolean(
    state.user && (state.user.role === 'ADMIN' || state.user.role === 'PARTNER')
  );

  const value: AuthContextValue = {
    ...state,
    setAuth,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
