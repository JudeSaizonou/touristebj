import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../api/auth';

const TOKEN_KEY = 'touriste_token';
const USER_KEY = 'touriste_user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, user: AuthUser) => void;
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

  const setAuth = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ token, user, ready: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ token: null, user: null, ready: true });
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
