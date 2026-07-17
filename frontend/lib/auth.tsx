"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch } from "./api";
import type { User } from "./types";

const TOKEN_KEY = "gfrm_token";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async (storedToken: string) => {
    const profile = await apiFetch<User>("/api/auth/me/", {}, storedToken);
    setToken(storedToken);
    setUser(profile);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    loadSession(stored)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, [loadSession]);

  const login = useCallback(async (username: string, password: string) => {
    const payload = await apiFetch<{ token: string; user: User }>(
      "/api/auth/login/",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      },
    );
    localStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiFetch("/api/auth/logout/", { method: "POST" }, token);
      } catch {
        // ignore network errors on logout
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function canAccessRoyalties(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "admin";
}

export function canAccessSplits(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "artist" || role === "admin";
}

export function canManageSplits(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "admin";
}

export function canAccessPayments(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "artist" || role === "admin";
}

export function canManagePayments(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "admin";
}

export function canManageCatalog(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "ar" || role === "admin";
}

export function canAccessAuditLog(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "admin";
}

export function isArtistRole(role: User["role"]): boolean {
  return role === "artist";
}

export function canViewRoster(role: User["role"]): boolean {
  return role !== "artist";
}
