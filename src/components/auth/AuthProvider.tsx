'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  register: (input: { email: string; password: string; name: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function handleJsonResponse(response: Response, fallbackError: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || fallbackError);
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await handleJsonResponse(response, 'Failed to load session');
      setUser(data.user);
      setStatus('authenticated');
      return data.user as AuthUser;
    } catch (error) {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (input: { email: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await handleJsonResponse(response, 'Login failed');
    setUser(data.user);
    setStatus('authenticated');
    return data.user as AuthUser;
  };

  const register = async (input: { email: string; password: string; name: string }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await handleJsonResponse(response, 'Registration failed');
    setUser(data.user);
    setStatus('authenticated');
    return data.user as AuthUser;
  };

  const logout = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    setUser(null);
    setStatus('unauthenticated');
  };

  const value: AuthContextValue = {
    user,
    status,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
