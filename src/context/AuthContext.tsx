import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AuthUser } from '../api/auth';

const TOKEN_KEY = 'touriste_token';
const REFRESH_KEY = 'touriste_refresh';
const USER_KEY = 'touriste_user';

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
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    ready: false,
  });

  useEffect(() => {
    const { token, user } = readStored();
    setState({ token, user, ready: true });
  }, []);

  // Listen for forced logout (e.g. expired token, failed refresh)
  useEffect(() => {
    const handleForceLogout = () => {
      setState({ token: null, user: null, ready: true });
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => window.removeEventListener('auth:force-logout', handleForceLogout);
  }, []);

  const logoutInProgress = useRef(false);

  const setAuth = useCallback((token: string, user: AuthUser, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    setState({ token, user, ready: true });
  }, []);

  const logout = useCallback(async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    // Invalidate token server-side
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
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
