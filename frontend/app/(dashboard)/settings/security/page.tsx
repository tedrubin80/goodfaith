"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type SetupResponse = {
  secret: string;
  provisioning_uri: string;
  qr_code: string;
};

type ConfirmResponse = {
  backup_codes: string[];
  user: {
    is_2fa_enabled: boolean;
    must_enable_2fa: boolean;
  };
};

export default function SecuritySettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSetup(null);
    setBackupCodes(null);
    setConfirmCode("");
  }, [user?.is_2fa_enabled]);

  if (!user || !token) return null;

  async function startSetup() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const payload = await apiFetch<SetupResponse>(
        "/api/auth/2fa/setup/",
        { method: "POST" },
        token,
      );
      setSetup(payload);
      setBackupCodes(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start 2FA setup.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const payload = await apiFetch<ConfirmResponse>(
        "/api/auth/2fa/confirm/",
        {
          method: "POST",
          body: JSON.stringify({ code: confirmCode }),
        },
        token,
      );
      setSetup(null);
      setConfirmCode("");
      setBackupCodes(payload.backup_codes);
      setMessage("Two-factor authentication is now enabled.");
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function disable2fa(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch(
        "/api/auth/2fa/disable/",
        {
          method: "POST",
          body: JSON.stringify({ password: disablePassword, code: disableCode }),
        },
        token,
      );
      setDisablePassword("");
      setDisableCode("");
      setMessage("Two-factor authentication disabled.");
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not disable 2FA.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Security"
        description="Protect your account with two-factor authentication."
      />

      {user.must_enable_2fa ? (
        <div
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
          role="status"
        >
          Your role requires two-factor authentication before you can access royalties,
          splits, activity, or export.
        </div>
      ) : null}

      {message ? (
        <p className="mb-4 text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 max-w-xl">
        <h2 className="text-lg font-semibold">Two-factor authentication</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {user.is_2fa_enabled
            ? "Your account is protected with an authenticator app."
            : user.requires_2fa
              ? "Required for Manager, Finance, and Admin roles."
              : "Optional — add an extra layer of security to your account."}
        </p>

        {user.is_2fa_enabled ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              To disable 2FA, enter your password and a current authenticator or backup code.
              {user.requires_2fa
                ? " Disabling is not available for your role."
                : null}
            </p>
            {!user.requires_2fa ? (
              <form onSubmit={disable2fa} className="space-y-3">
                <input
                  type="password"
                  placeholder="Password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Authenticator or backup code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  required
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-2)] disabled:opacity-60"
                >
                  Disable 2FA
                </button>
              </form>
            ) : null}
          </div>
        ) : setup ? (
          <form onSubmit={confirmSetup} className="mt-6 space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              Scan this QR code with Google Authenticator, 1Password, or Authy, then enter
              the 6-digit code to confirm.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qr_code}
              alt="Authenticator QR code"
              className="mx-auto h-48 w-48 rounded-lg border border-[var(--color-border)] bg-white p-2"
            />
            <p className="text-xs text-[var(--color-muted)] break-all">
              Manual key: <span className="font-mono">{setup.secret}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
            >
              Confirm and enable
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={startSetup}
            disabled={busy}
            className="mt-6 rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {busy ? "Starting…" : "Set up authenticator app"}
          </button>
        )}
      </section>

      {backupCodes ? (
        <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 max-w-xl">
          <h2 className="text-lg font-semibold">Save your backup codes</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Each code works once if you lose access to your authenticator. Store them
            somewhere safe — they will not be shown again.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code) => (
              <li
                key={code}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
              >
                {code}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 max-w-xl">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Changing your password signs you out everywhere — you will need to sign in again.
        </p>
        <PasswordForm />
      </section>
    </>
  );
}

function PasswordForm() {
  const { token, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await apiFetch(
        "/api/auth/password/",
        {
          method: "POST",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
        token,
      );
      setMessage("Password updated. Signing you out…");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => logout(), 800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <input
        type="password"
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="New password (8+ characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-2)] disabled:opacity-60"
      >
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
