"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  sendMagicLink: (email: string) => Promise<void>;
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
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await handleJsonResponse(response, "Failed to load session");
      setUser(data.user);
      setStatus("authenticated");
      return data.user as AuthUser;
    } catch (error) {
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      throw new Error("Logout failed");
    }
    setUser(null);
    setStatus("unauthenticated");
  };

  const sendMagicLink = async (email: string) => {
    const response = await fetch("/api/auth/magic-link/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    await handleJsonResponse(response, "Failed to send magic link");
  };

  const value: AuthContextValue = {
    user,
    status,
    logout,
    refreshSession,
    sendMagicLink,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
