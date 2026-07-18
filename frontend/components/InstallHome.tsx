"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { InstallSignIn } from "@/components/InstallSignIn";
import { API_URL } from "@/lib/api";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-install-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-install-sans",
});

type HealthPayload = {
  status: string;
  checks?: { database?: boolean; celery?: boolean };
};

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
    ? "API offline"
    : health?.status === "ok"
      ? "Instance healthy"
      : health?.status === "degraded"
        ? "Degraded"
        : "Checking…";

  const statusTone = healthError
    ? "bad"
    : health?.status === "ok"
      ? "good"
      : health?.status === "degraded"
        ? "warn"
        : "idle";

  return (
    <div className={`${display.variable} ${sans.variable} install-home`}>
      <section className="install-stage" id="top">
        <div className="install-stage__atmosphere" aria-hidden>
          <span className="install-orb install-orb--a" />
          <span className="install-orb install-orb--b" />
          <span className="install-stage__sparkles" />
        </div>

        <div className="install-stage__logo animate-logo" aria-hidden>
          <Image
            src="/brand/goodfaith-logo.png"
            alt=""
            width={1024}
            height={1024}
            priority
            className="install-stage__logo-img"
          />
        </div>

        <div className="install-stage__content">
          <header className="install-stage__copy animate-rise">
            <p className="install-brand">Good Faith</p>
            <h1 className="install-title animate-rise animate-rise-delay-1">
              Record Management
            </h1>
            <p className="install-lead animate-rise animate-rise-delay-2">
              Self-hosted label ops — royalties, splits, and role-based portals.
              Your instance. Your data.
            </p>
            <div
              className={[
                "install-health animate-rise animate-rise-delay-3",
                `install-health--${statusTone}`,
              ].join(" ")}
              role="status"
            >
              <span className="install-health__dot" />
              {statusLabel}
            </div>
          </header>

          <div className="install-stage__panel animate-rise animate-rise-delay-2">
            <InstallSignIn />
          </div>
        </div>
      </section>

      <section className="install-footstrip" aria-label="Instance details">
        <div className="install-footstrip__inner">
          <dl>
            <div>
              <dt>Database</dt>
              <dd>{checkLabel(health?.checks?.database, healthError)}</dd>
            </div>
            <div>
              <dt>Celery</dt>
              <dd>{checkLabel(health?.checks?.celery, healthError)}</dd>
            </div>
            <div>
              <dt>API</dt>
              <dd className="install-footstrip__api">{API_URL}</dd>
            </div>
          </dl>
          <p className="install-footstrip__hint">
            Portal (this page) → Vercel · API &amp; workers → Railway · or all-in-one via Docker
            Compose
          </p>
        </div>
      </section>
    </div>
  );
}

function checkLabel(value: boolean | undefined, errored: boolean): string {
  if (errored) return "offline";
  if (value === undefined) return "…";
  return value ? "ok" : "down";
}
