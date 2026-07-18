"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canAccessAnalytics, useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import type {
  AnalyticsAmountRow,
  AnalyticsSummary,
  ArtistAnalyticsSummary,
  LabelAnalyticsSummary,
  OpsAnalyticsSummary,
} from "@/lib/types";

function maxAmount(rows: AnalyticsAmountRow[]): number {
  return rows.reduce((max, row) => Math.max(max, Number(row.amount)), 0);
}

function BarList({
  rows,
  currency,
  labelKey,
  emptyLabel,
}: {
  rows: (AnalyticsAmountRow & Record<string, string | number | null>)[];
  currency: string;
  labelKey: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">{emptyLabel}</p>;
  }
  const peak = maxAmount(rows) || 1;
  return (
    <ul className="space-y-3">
      {rows.map((row, index) => {
        const label = String(row[labelKey] ?? "—");
        const pct = Math.max(2, (Number(row.amount) / peak) * 100);
        return (
          <li key={`${label}-${index}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
              <span className="truncate font-medium">{label}</span>
              <span className="shrink-0 tabular-nums text-[var(--color-muted)]">
                {formatMoney(row.amount, currency)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-medium text-[var(--color-muted)]">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function LabelView({ data }: { data: LabelAnalyticsSummary }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat
          label="Statement gross"
          value={formatMoney(data.totals.statement_gross, data.currency)}
        />
        <Stat
          label="Allocated in runs"
          value={formatMoney(data.totals.run_allocated, data.currency)}
        />
        <Stat
          label="Payouts pending"
          value={formatMoney(data.totals.payout_pending, data.currency)}
        />
        <Stat
          label="Payouts paid"
          value={formatMoney(data.totals.payout_paid, data.currency)}
        />
      </div>

      <p className="text-sm text-[var(--color-muted)] mb-8">
        Catalog: {data.totals.artists} artists · {data.totals.releases} releases ·{" "}
        {data.totals.tracks} tracks
        {data.pipeline ? ` · Pipeline: ${data.pipeline.total} prospects` : ""}
      </p>

      {data.by_period.length === 0 && data.by_distributor.length === 0 ? (
        <EmptyState
          title="No royalty data yet"
          description="Upload and process distributor statements, then consolidate a royalty run to populate analytics."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold mb-4">By period</h2>
            <BarList
              rows={data.by_period}
              currency={data.currency}
              labelKey="period"
              emptyLabel="No period activity."
            />
          </section>
          <section>
            <h2 className="text-sm font-semibold mb-4">By distributor</h2>
            <BarList
              rows={data.by_distributor}
              currency={data.currency}
              labelKey="distributor_display"
              emptyLabel="No distributor totals."
            />
          </section>
          <section>
            <h2 className="text-sm font-semibold mb-4">Top artists</h2>
            <BarList
              rows={data.by_artist}
              currency={data.currency}
              labelKey="artist_name"
              emptyLabel="No allocated artist earnings yet."
            />
          </section>
          <section>
            <h2 className="text-sm font-semibold mb-4">Top tracks</h2>
            <BarList
              rows={data.by_track}
              currency={data.currency}
              labelKey="track_title"
              emptyLabel="No track allocations yet."
            />
          </section>
        </div>
      )}
    </>
  );
}

function ArtistView({ data }: { data: ArtistAnalyticsSummary }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <Stat
          label="Earnings across runs"
          value={formatMoney(data.totals.earnings, data.currency)}
        />
        <Stat
          label="Payouts pending"
          value={formatMoney(data.totals.payout_pending, data.currency)}
        />
        <Stat
          label="Payouts paid"
          value={formatMoney(data.totals.payout_paid, data.currency)}
        />
      </div>

      {data.by_track.length === 0 ? (
        <EmptyState
          title="No earnings yet"
          description="Your share appears here after the label consolidates a royalty run that includes your tracks."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold mb-4">By period</h2>
            <BarList
              rows={data.by_period}
              currency={data.currency}
              labelKey="period"
              emptyLabel="No period activity."
            />
          </section>
          <section>
            <h2 className="text-sm font-semibold mb-4">By track</h2>
            <BarList
              rows={data.by_track}
              currency={data.currency}
              labelKey="track_title"
              emptyLabel="No track earnings."
            />
          </section>
          <section className="lg:col-span-2">
            <h2 className="text-sm font-semibold mb-4">By royalty run</h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Run</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_run.map((row) => (
                    <tr key={row.run_id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3 font-medium">{row.run_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(row.amount, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function OpsView({ data }: { data: OpsAnalyticsSummary }) {
  const activeStages = data.pipeline.by_stage.filter((row) => row.count > 0);
  const peak = activeStages.reduce((max, row) => Math.max(max, row.count), 0) || 1;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        <Stat label="Artists" value={String(data.catalog.artists)} />
        <Stat label="Releases" value={String(data.catalog.releases)} />
        <Stat label="Tracks" value={String(data.catalog.tracks)} />
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-1">Pipeline</h2>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          {data.pipeline.total} prospects across stages
        </p>
        {activeStages.length === 0 ? (
          <EmptyState
            title="No prospects yet"
            description="Add talent to the A&R pipeline to track signing progress here."
          />
        ) : (
          <ul className="space-y-3 max-w-lg">
            {activeStages.map((row) => {
              const pct = Math.max(2, (row.count / peak) * 100);
              return (
                <li key={row.stage}>
                  <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
                    <span className="font-medium">{row.stage_display}</span>
                    <span className="tabular-nums text-[var(--color-muted)]">{row.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AnalyticsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = Boolean(user && canAccessAnalytics(user.role));

  const description = useMemo(() => {
    if (!user) return "";
    if (user.role === "ar") {
      return "Catalog size and A&R pipeline stage counts — no royalty or payout figures.";
    }
    if (user.role === "artist") {
      return "Your earnings by period, track, and royalty run. Label-wide financials are not shown.";
    }
    return "Internal reporting from uploaded statements, consolidated runs, and payouts. No external streaming APIs.";
  }, [user]);

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    apiFetch<AnalyticsSummary>("/api/analytics/summary/", {}, token)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load analytics."),
      )
      .finally(() => setLoading(false));
  }, [token, hasAccess]);

  if (!user || !hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to analytics.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={user.role === "artist" ? "My analytics" : "Analytics"}
        description={description}
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {data?.scope === "label" ? <LabelView data={data} /> : null}
      {data?.scope === "artist" ? <ArtistView data={data} /> : null}
      {data?.scope === "ops" ? <OpsView data={data} /> : null}
    </>
  );
}
