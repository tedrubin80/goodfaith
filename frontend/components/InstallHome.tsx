"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";

import { API_URL } from "@/lib/api";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-install-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-install-sans",
});

type HealthPayload = {
  status: string;
  checks?: { database?: boolean; celery?: boolean };
};

const MODULES = [
  { name: "Catalog", detail: "Artists, releases, ISRC / ISWC / UPC" },
  { name: "Royalties", detail: "10-distributor statement hub" },
  { name: "Splits & payouts", detail: "Finalize sheets, ACH CSV export" },
  { name: "Publishing", detail: "Works, shares, PRO status" },
  { name: "A&R & sync", detail: "Pipeline and licensing tracker" },
  { name: "Ops", detail: "Contracts, marketing, analytics, export" },
] as const;

const ROLES = [
  { role: "Artist", blurb: "Own releases, earnings, payouts" },
  { role: "Manager", blurb: "Full label ops and roster" },
  { role: "Finance", blurb: "Statements, runs, activity log" },
  { role: "A&R", blurb: "Pipeline without financial data" },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Start the stack",
    body: "docker compose up --build",
  },
  {
    n: "02",
    title: "Seed a label",
    body: "python manage.py seed_label --demo",
  },
  {
    n: "03",
    title: "Sign in",
    body: "Open the portal and use your manager credentials.",
  },
] as const;

export function InstallHome() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch(`${API_URL}/api/health/`, { cache: "no-store" });
        const data = (await res.json()) as HealthPayload;
        if (!cancelled) {
          setHealth(data);
          setHealthError(!res.ok);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setHealthError(true);
        }
      }
    }

    void ping();
    const id = window.setInterval(ping, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const statusLabel = healthError
    ? "API unreachable"
    : health?.status === "ok"
      ? "Instance healthy"
      : health?.status === "degraded"
        ? "Instance degraded"
        : "Checking…";

  const statusTone = healthError
    ? "bad"
    : health?.status === "ok"
      ? "good"
      : health?.status === "degraded"
        ? "warn"
        : "idle";

  return (
    <div
      className={`${display.variable} ${sans.variable} install-home min-h-full flex flex-col`}
    >
      <section className="install-hero relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-16 pt-24 sm:px-10 sm:pb-20">
        <div className="install-hero__glow" aria-hidden />
        <div className="install-hero__grid" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="install-brand animate-rise">Good Faith</p>
          <h1 className="install-title mt-3 max-w-3xl animate-rise animate-rise-delay-1">
            Record management, self-hosted.
          </h1>
          <p className="install-lead mt-5 max-w-xl animate-rise animate-rise-delay-2">
            Open-source label ops for indie catalogs — royalties, splits, rights,
            and role-based portals. No SaaS lock-in. No cut of your earnings.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise animate-rise-delay-3">
            <Link href="/login" className="install-btn install-btn--primary">
              Open portal
            </Link>
            <a href="#get-started" className="install-btn install-btn--ghost">
              First-run setup
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 sm:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="install-section-title">This instance</h2>
              <p className="mt-2 max-w-md text-[var(--color-muted)]">
                Live status from your local API. Nothing leaves your machine unless
                you deploy it.
              </p>
            </div>
            <div
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                statusTone === "good" && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
                statusTone === "warn" && "bg-amber-500/10 text-amber-900 dark:text-amber-200",
                statusTone === "bad" && "bg-red-500/10 text-red-800 dark:text-red-200",
                statusTone === "idle" && "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
              ]
                .filter(Boolean)
                .join(" ")}
              role="status"
            >
              <span
                className={[
                  "size-2 rounded-full",
                  statusTone === "good" && "bg-emerald-500",
                  statusTone === "warn" && "bg-amber-500",
                  statusTone === "bad" && "bg-red-500",
                  statusTone === "idle" && "bg-[var(--color-muted)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              {statusLabel}
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="install-stat">
              <dt>Database</dt>
              <dd>{checkLabel(health?.checks?.database, healthError)}</dd>
            </div>
            <div className="install-stat">
              <dt>Celery</dt>
              <dd>{checkLabel(health?.checks?.celery, healthError)}</dd>
            </div>
            <div className="install-stat">
              <dt>API</dt>
              <dd className="font-mono text-sm truncate">{API_URL}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10" id="modules">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="install-section-title">What&apos;s included</h2>
          <p className="mt-2 max-w-lg text-[var(--color-muted)]">
            Core label modules ship with the install — deepen them as your catalog
            grows.
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => (
              <li key={mod.name} className="border-t border-[var(--color-border)] pt-4">
                <h3 className="font-semibold tracking-tight">{mod.name}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{mod.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 sm:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="install-section-title">Role-based portals</h2>
          <p className="mt-2 max-w-lg text-[var(--color-muted)]">
            Shared spreadsheets expose splits and payouts. Good Faith separates who
            sees what.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((item) => (
              <div key={item.role}>
                <p className="text-lg font-semibold tracking-tight">{item.role}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{item.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10" id="get-started">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="install-section-title">First-run setup</h2>
          <ol className="mt-10 space-y-8">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-5 sm:gap-8">
                <span className="install-step-n shrink-0">{step.n}</span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1 font-mono text-sm text-[var(--color-muted)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/login" className="install-btn install-btn--primary">
              Sign in
            </Link>
            <a
              href="https://github.com/tedrubin80/goodfaith"
              className="install-btn install-btn--ghost"
              target="_blank"
              rel="noreferrer"
            >
              Source on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--color-border)] px-6 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            Good Faith Record Management — open source, self-hosted.
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            Royalty payouts via mark-paid + ACH CSV. No subscription billing.
          </p>
        </div>
      </footer>
    </div>
  );
}

function checkLabel(value: boolean | undefined, errored: boolean): string {
  if (errored) return "offline";
  if (value === undefined) return "…";
  return value ? "ok" : "down";
}
