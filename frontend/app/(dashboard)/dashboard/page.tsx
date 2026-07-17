"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArtistDashboard } from "@/components/ArtistDashboard";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canAccessRoyalties, isArtistRole, useAuth } from "@/lib/auth";
import type { ArtistEarning, Payout, Release, RoyaltyStatement, SplitSheet } from "@/lib/types";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [sheets, setSheets] = useState<SplitSheet[]>([]);
  const [earnings, setEarnings] = useState<ArtistEarning[]>([]);
  const [loading, setLoading] = useState(true);

  const isArtist = user && isArtistRole(user.role);

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    if (isArtist) {
      Promise.all([
        apiFetch<Release[]>("/api/catalog/releases/", {}, token),
        apiFetch<Payout[]>("/api/payments/payouts/", {}, token),
        apiFetch<SplitSheet[]>("/api/splits/sheets/", {}, token),
        apiFetch<ArtistEarning[]>("/api/royalties/my-earnings/", {}, token),
      ])
        .then(([releaseData, payoutData, sheetData, earningsData]) => {
          setReleases(releaseData);
          setPayouts(payoutData);
          setSheets(sheetData);
          setEarnings(earningsData);
        })
        .finally(() => setLoading(false));
      return;
    }

    apiFetch<Release[]>("/api/catalog/releases/", {}, token)
      .then(setReleases)
      .catch(() => setReleases([]));

    if (canAccessRoyalties(user.role)) {
      apiFetch<RoyaltyStatement[]>("/api/royalties/statements/", {}, token)
        .then(setStatements)
        .catch(() => setStatements([]));
    }
    setLoading(false);
  }, [token, user, isArtist]);

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  if (isArtist) {
    const displayName = user.first_name || user.username;
    return (
      <ArtistDashboard
        releases={releases}
        payouts={payouts}
        sheets={sheets}
        earnings={earnings}
        displayName={displayName}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.first_name ? `, ${user.first_name}` : ""}`}
        description="Your label at a glance — catalog releases and royalty statement activity."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Catalog</h2>
            <Link
              href="/catalog"
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{releases.length}</p>
          <p className="text-sm text-[var(--color-muted)]">releases in catalog</p>
        </section>

        {user && canAccessRoyalties(user.role) ? (
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Royalties</h2>
              <Link
                href="/royalties"
                className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
              >
                View all
              </Link>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{statements.length}</p>
            <p className="text-sm text-[var(--color-muted)]">distributor statements uploaded</p>
          </section>
        ) : (
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-semibold">Royalties</h2>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Royalty data is limited to Finance and Manager roles.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
