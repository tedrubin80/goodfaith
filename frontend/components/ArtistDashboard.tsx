"use client";

import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import type { ArtistEarning, Payout, Release, SplitSheet } from "@/lib/types";

type ArtistDashboardProps = {
  releases: Release[];
  payouts: Payout[];
  sheets: SplitSheet[];
  earnings: ArtistEarning[];
  displayName: string;
};

export function ArtistDashboard({
  releases,
  payouts,
  sheets,
  earnings,
  displayName,
}: ArtistDashboardProps) {
  const pendingTotal = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const paidTotal = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const earningsTotal = earnings.reduce((sum, row) => sum + Number(row.amount), 0);
  const trackCount = releases.reduce((sum, r) => sum + r.track_count, 0);
  const recentPayouts = [...payouts]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome, ${displayName}`}
        description="Your releases, split sheets, and royalty payouts from the label."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-medium text-[var(--color-muted)]">Releases</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{releases.length}</p>
        </section>
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-medium text-[var(--color-muted)]">Tracks</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{trackCount}</p>
        </section>
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--color-muted)]">Run earnings</h2>
            <Link
              href="/earnings"
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              Details
            </Link>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatMoney(String(earningsTotal))}
          </p>
        </section>
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-medium text-[var(--color-muted)]">Pending</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatMoney(String(pendingTotal))}
          </p>
        </section>
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-medium text-[var(--color-muted)]">Paid out</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatMoney(String(paidTotal))}
          </p>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My releases</h2>
            <Link
              href="/catalog"
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              View all
            </Link>
          </div>
          {releases.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              No releases linked to your artist profile yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {releases.slice(0, 5).map((release) => (
                <li key={release.id}>
                  <Link
                    href={`/catalog/releases/${release.id}`}
                    className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:bg-[var(--color-surface-2)]"
                  >
                    <span className="font-medium">{release.title}</span>
                    <span className="block text-xs text-[var(--color-muted)] mt-0.5">
                      {release.track_count} track{release.track_count === 1 ? "" : "s"}
                      {release.release_date ? ` · ${formatDate(release.release_date)}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent payouts</h2>
            <Link
              href="/payments"
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              View all
            </Link>
          </div>
          {recentPayouts.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Payouts appear here after your label issues a royalty run that includes you.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentPayouts.map((payout) => (
                <li
                  key={payout.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div>
                    <span className="font-medium tabular-nums">
                      {formatMoney(payout.amount)}
                    </span>
                    <span className="block text-xs text-[var(--color-muted)] mt-0.5">
                      {formatDate(payout.created_at)}
                    </span>
                  </div>
                  <StatusBadge status={payout.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sheets.length > 0 ? (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Split sheets</h2>
            <Link
              href="/splits"
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Track</th>
                  <th className="px-4 py-3 font-medium">Release</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Your share</th>
                </tr>
              </thead>
              <tbody>
                {sheets.slice(0, 5).map((sheet) => {
                  const myEntry = sheet.entries.find((e) => e.role === "artist") ?? sheet.entries[0];
                  return (
                    <tr key={sheet.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3 font-medium">{sheet.track_title}</td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{sheet.release_title}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sheet.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {myEntry ? `${myEntry.percentage}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
