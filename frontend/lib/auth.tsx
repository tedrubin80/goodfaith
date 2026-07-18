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

export type LoginResult =
  | { kind: "complete"; user: User; token: string }
  | { kind: "requires_2fa"; pendingToken: string; user: User };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  verify2fa: (pendingToken: string, code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const payload = await apiFetch<{
      token?: string;
      requires_2fa?: boolean;
      pending_token?: string;
      user: User;
    }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (payload.requires_2fa && payload.pending_token) {
      return {
        kind: "requires_2fa",
        pendingToken: payload.pending_token,
        user: payload.user,
      };
    }

    if (!payload.token) {
      throw new Error("Sign in failed.");
    }

    localStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
    return { kind: "complete", user: payload.user, token: payload.token };
  }, []);

  const verify2fa = useCallback(async (pendingToken: string, code: string) => {
    const payload = await apiFetch<{ token: string; user: User }>(
      "/api/auth/2fa/verify/",
      {
        method: "POST",
        body: JSON.stringify({ pending_token: pendingToken, code }),
      },
    );
    localStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const profile = await apiFetch<User>("/api/auth/me/", {}, token);
    setUser(profile);
  }, [token]);

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
    () => ({ user, token, loading, login, verify2fa, refreshUser, logout }),
    [user, token, loading, login, verify2fa, refreshUser, logout],
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

export function canAccessContracts(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "ar" || role === "artist" || role === "admin";
}

export function canManageContracts(role: User["role"]): boolean {
  return role === "manager" || role === "ar" || role === "admin";
}

export function canAccessPublishing(role: User["role"]): boolean {
  return role === "manager" || role === "finance" || role === "ar" || role === "artist" || role === "admin";
}

export function canManagePublishing(role: User["role"]): boolean {
  return role === "manager" || role === "ar" || role === "admin";
}

export function canViewRoster(role: User["role"]): boolean {
  return role !== "artist";
}

export function canAccessARPipeline(role: User["role"]): boolean {
  return role === "manager" || role === "ar" || role === "admin";
}

export function canManageARPipeline(role: User["role"]): boolean {
  return role === "manager" || role === "ar" || role === "admin";
}

export function canAccessAnalytics(role: User["role"]): boolean {
  return (
    role === "manager" ||
    role === "finance" ||
    role === "ar" ||
    role === "artist" ||
    role === "admin"
  );
}

export function canAccessSync(role: User["role"]): boolean {
  return (
    role === "manager" ||
    role === "finance" ||
    role === "ar" ||
    role === "artist" ||
    role === "admin"
  );
}

export function canManageSync(role: User["role"]): boolean {
  return role === "manager" || role === "ar" || role === "admin";
}

export function canAccessMarketing(role: User["role"]): boolean {
  return (
    role === "manager" ||
    role === "finance" ||
    role === "ar" ||
    role === "artist" ||
    role === "admin"
  );
}

export function canManageMarketing(role: User["role"]): boolean {
  return role === "manager" || role === "ar" || role === "admin";
}
