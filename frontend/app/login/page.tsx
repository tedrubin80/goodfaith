"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";

function LoginForm() {
  const { login, verify2fa, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return (
      <div className="min-h-full flex items-center justify-center text-sm text-[var(--color-muted)]">
        Redirecting…
      </div>
    );
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result.kind === "requires_2fa") {
        setPendingToken(result.pendingToken);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handle2faSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!pendingToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await verify2fa(pendingToken, code);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]">
          ← Back
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {pendingToken ? "Two-factor authentication" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {pendingToken
            ? "Enter the 6-digit code from your authenticator app, or a backup code."
            : "Use your label portal credentials."}
        </p>

        {pendingToken ? (
          <form onSubmit={handle2faSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1.5">
                Authenticator code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[var(--color-primary-fill)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-fill)] hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Verifying…" : "Verify and sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingToken(null);
                setCode("");
                setError(null);
              }}
              className="w-full text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[var(--color-primary-fill)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-fill)] hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
