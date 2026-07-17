"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { isArtistRole, useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import type { ArtistEarning } from "@/lib/types";

export default function EarningsPage() {
  const { token, user } = useAuth();
  const [earnings, setEarnings] = useState<ArtistEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || !isArtistRole(user.role)) {
      setLoading(false);
      return;
    }

    apiFetch<ArtistEarning[]>("/api/royalties/my-earnings/", {}, token)
      .then(setEarnings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load earnings."))
      .finally(() => setLoading(false));
  }, [token, user]);

  const total = useMemo(
    () => earnings.reduce((sum, row) => sum + Number(row.amount), 0),
    [earnings],
  );

  if (!user || !isArtistRole(user.role)) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Earnings breakdown is available on the artist portal only.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title="My earnings"
        description="Your share from each royalty run — track-level breakdown before payouts are issued."
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 max-w-sm">
        <h2 className="text-sm font-medium text-[var(--color-muted)]">Total across runs</h2>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{formatMoney(String(total))}</p>
      </section>

      {earnings.length === 0 ? (
        <EmptyState
          title="No earnings yet"
          description="Lines appear here after your label consolidates a royalty run that includes your tracks."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Track</th>
                <th className="px-4 py-3 font-medium">ISRC</th>
                <th className="px-4 py-3 font-medium">Share</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <span className="font-medium">{row.run_name}</span>
                    <span className="block text-xs text-[var(--color-muted)] mt-0.5">
                      {formatDate(row.run_created_at)} · {row.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.track_title || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.isrc || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{row.share_percentage}%</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatMoney(row.amount, row.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
