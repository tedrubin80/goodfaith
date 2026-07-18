"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { apiFetch, downloadRoyaltyRunPdf } from "@/lib/api";
import { canAccessRoyalties, canManagePayments, useAuth } from "@/lib/auth";
import { formatMoney, titleCase } from "@/lib/format";
import type { PayoutBatch, RoyaltyRun, RoyaltyRunPayout } from "@/lib/types";

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [run, setRun] = useState<RoyaltyRun | null>(null);
  const [payouts, setPayouts] = useState<RoyaltyRunPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const hasAccess = user && canAccessRoyalties(user.role);
  const canIssue = user && canManagePayments(user.role);

  const load = useCallback(async () => {
    if (!token || !params.id || !hasAccess) return;
    setLoading(true);
    setError(null);
    try {
      const [runData, payoutData] = await Promise.all([
        apiFetch<RoyaltyRun>(`/api/royalties/runs/${params.id}/`, {}, token),
        apiFetch<RoyaltyRunPayout[]>(
          `/api/royalties/runs/${params.id}/payouts/`,
          {},
          token,
        ),
      ]);
      setRun(runData);
      setPayouts(payoutData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load royalty run.");
    } finally {
      setLoading(false);
    }
  }, [token, params.id, hasAccess]);

  useEffect(() => {
    load();
  }, [load]);

  async function issuePayouts() {
    if (!token || !run || !canIssue) return;
    setIssuing(true);
    setError(null);
    try {
      const batch = await apiFetch<PayoutBatch>(
        "/api/payments/batches/from_run/",
        {
          method: "POST",
          body: JSON.stringify({ run: run.id }),
        },
        token,
      );
      setRun((current) =>
        current ? { ...current, status: "closed", payout_batch_id: batch.id } : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue payouts.");
    } finally {
      setIssuing(false);
    }
  }

  async function downloadPdf() {
    if (!token || !run) return;
    setDownloadingPdf(true);
    setError(null);
    try {
      await downloadRoyaltyRunPdf(run.id, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF download failed.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  const participantTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payout of payouts) {
      totals.set(
        payout.participant_name,
        (totals.get(payout.participant_name) ?? 0) + Number(payout.amount),
      );
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [payouts]);

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to royalty runs.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading run…</p>;
  }

  if (error || !run) {
    return (
      <div>
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error ?? "Run not found."}
        </p>
        <Link href="/royalties" className="inline-block mt-4 text-sm text-[var(--color-primary-text)]">
          ← Back to royalties
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/royalties"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        ← Royalties
      </Link>

      <PageHeader
        title={run.name}
        description={`${run.statement_count} statement${run.statement_count === 1 ? "" : "s"} consolidated · ${titleCase(run.status)}`}
        action={
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={downloadPdf}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-2)] disabled:opacity-50"
          >
            {downloadingPdf ? "Downloading…" : "Download PDF"}
          </button>
        }
      />

      {canIssue && run.status === "ready" && !run.payout_batch_id && run.payout_count > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm flex-1">
            This run is ready. Issue a payout batch to aggregate participant totals for payment.
          </p>
          <button
            type="button"
            disabled={issuing}
            onClick={issuePayouts}
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {issuing ? "Issuing…" : "Issue payouts"}
          </button>
        </div>
      ) : null}

      {run.payout_batch_id ? (
        <p className="mb-6 text-sm">
          Payout batch issued.{" "}
          <Link
            href="/payments"
            className="font-medium text-[var(--color-primary-text)] hover:underline"
          >
            View payments →
          </Link>
        </p>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-3 mb-8 text-sm">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-[var(--color-muted)]">Total distributed</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {formatMoney(run.total_amount, run.currency)}
          </dd>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-[var(--color-muted)]">Payout lines</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{run.payout_count}</dd>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-[var(--color-muted)]">Participants</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {participantTotals.length}
          </dd>
        </div>
      </dl>

      {run.consolidation_error ? (
        <p className="mb-6 text-sm text-red-600 dark:text-red-400">{run.consolidation_error}</p>
      ) : null}

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">By participant</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {participantTotals.map(([name, total]) => (
            <article
              key={name}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <h3 className="font-medium">{name}</h3>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(String(total), run.currency)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Payout breakdown</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No payouts in this run.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Participant</th>
                  <th className="px-4 py-3 font-medium">Track</th>
                  <th className="px-4 py-3 font-medium">ISRC</th>
                  <th className="px-4 py-3 font-medium text-right">Share</th>
                  <th className="px-4 py-3 font-medium text-right">Gross</th>
                  <th className="px-4 py-3 font-medium text-right">Payout</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <span className="font-medium">{payout.participant_name}</span>
                      {payout.role_display ? (
                        <span className="block text-xs text-[var(--color-muted)] capitalize">
                          {payout.role_display}
                        </span>
                      ) : null}
                      {payout.unallocated_reason ? (
                        <span className="block text-xs text-amber-700 dark:text-amber-300">
                          {payout.unallocated_reason}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{payout.track_title || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payout.isrc || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {payout.share_percentage}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(payout.track_gross, run.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatMoney(payout.amount, run.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
