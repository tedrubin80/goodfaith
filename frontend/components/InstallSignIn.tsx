"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function InstallSignIn() {
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
      <div className="install-signin install-signin--busy" role="status">
        Opening portal…
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
    <div className="install-signin">
      <div className="install-signin__head">
        <h2>{pendingToken ? "Two-factor authentication" : "Sign in"}</h2>
        <p>
          {pendingToken
            ? "Enter the 6-digit authenticator code, or a backup code."
            : "Use your label portal credentials."}
        </p>
      </div>

      {pendingToken ? (
        <form onSubmit={handle2faSubmit} className="install-signin__form">
          <label htmlFor="install-code">
            Authenticator code
            <input
              id="install-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>

          {error ? (
            <p className="install-signin__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="install-btn install-btn--primary">
            {submitting ? "Verifying…" : "Verify and sign in"}
          </button>

          <button
            type="button"
            className="install-signin__back"
            onClick={() => {
              setPendingToken(null);
              setCode("");
              setError(null);
            }}
          >
            ← Back to sign in
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="install-signin__form">
          <label htmlFor="install-username">
            Username
            <input
              id="install-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label htmlFor="install-password">
            Password
            <input
              id="install-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? (
            <p className="install-signin__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="install-btn install-btn--primary">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
