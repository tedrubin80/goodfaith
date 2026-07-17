"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch, downloadAchExport } from "@/lib/api";
import { canAccessPayments, canManagePayments, isArtistRole, useAuth } from "@/lib/auth";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import type { Payout, PayoutBatch } from "@/lib/types";

export default function PaymentsPage() {
  const { token, user } = useAuth();
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [artistPayouts, setArtistPayouts] = useState<Payout[]>([]);
  const [payoutsByBatch, setPayoutsByBatch] = useState<Record<number, Payout[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [exportingBatchId, setExportingBatchId] = useState<number | null>(null);
  const [references, setReferences] = useState<Record<number, string>>({});

  const hasAccess = user && canAccessPayments(user.role);
  const canManage = user && canManagePayments(user.role);
  const isArtist = user && isArtistRole(user.role);

  const loadBatches = useCallback(async () => {
    if (!token || !hasAccess) return;
    setLoading(true);
    setError(null);
    try {
      if (isArtist) {
        const data = await apiFetch<Payout[]>("/api/payments/payouts/", {}, token);
        setArtistPayouts(data);
      } else {
        const data = await apiFetch<PayoutBatch[]>("/api/payments/batches/", {}, token);
        setBatches(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  }, [token, hasAccess, isArtist]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  async function loadPayouts(batchId: number) {
    if (!token || payoutsByBatch[batchId]) return;
    try {
      const data = await apiFetch<Payout[]>(
        `/api/payments/batches/${batchId}/payouts/`,
        {},
        token,
      );
      setPayoutsByBatch((current) => ({ ...current, [batchId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payouts.");
    }
  }

  async function toggleBatch(batchId: number) {
    if (expandedId === batchId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(batchId);
    await loadPayouts(batchId);
  }

  async function exportAch(batchId: number) {
    if (!token || !canManage) return;
    setExportingBatchId(batchId);
    setError(null);
    try {
      await downloadAchExport(batchId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ACH export failed.");
    } finally {
      setExportingBatchId(null);
    }
  }

  async function markPaid(payout: Payout) {
    if (!token || !canManage) return;
    setMarkingId(payout.id);
    setError(null);
    try {
      const updated = await apiFetch<Payout>(
        `/api/payments/payouts/${payout.id}/mark_paid/`,
        {
          method: "POST",
          body: JSON.stringify({
            payment_reference: references[payout.id] ?? "",
          }),
        },
        token,
      );
      setPayoutsByBatch((current) => ({
        ...current,
        [payout.batch]: (current[payout.batch] ?? []).map((row) =>
          row.id === updated.id ? updated : row,
        ),
      }));
      await loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark payout as paid.");
    } finally {
      setMarkingId(null);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to payments.
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My payouts" : "Payments"}
        description={
          canManage
            ? "Issue payout batches from consolidated royalty runs and record payments."
            : "Your royalty payouts from the label."
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading payouts…</p>
      ) : isArtist ? (
        artistPayouts.length === 0 ? (
          <EmptyState
            title="No payouts yet"
            description="Payouts will appear here once your label issues a batch that includes you."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {artistPayouts.map((payout) => (
                  <tr key={payout.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatMoney(payout.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payout.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(payout.paid_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                      {payout.payment_reference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : batches.length === 0 ? (
        <EmptyState
          title="No payout batches yet"
          description={
            canManage
              ? "Consolidate a royalty run, then issue payouts from the run detail page."
              : "Payouts will appear here once your label issues a batch that includes you."
          }
          action={
            canManage ? (
              <Link
                href="/royalties"
                className="text-sm font-medium text-[var(--color-primary-text)] hover:underline"
              >
                Go to royalties →
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium w-8" />
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium">Created</th>
                {canManage ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const expanded = expandedId === batch.id;
                const payouts = payoutsByBatch[batch.id] ?? [];
                return (
                  <Fragment key={batch.id}>
                    <tr
                      className="border-t border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface)]"
                      onClick={() => toggleBatch(batch.id)}
                    >
                      <td className="px-4 py-3 text-[var(--color-muted)]">
                        {expanded ? "▾" : "▸"}
                      </td>
                      <td className="px-4 py-3 font-medium">{batch.name}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/royalties/runs/${batch.run}`}
                          className="text-[var(--color-primary-text)] hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {batch.run_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatMoney(batch.total_amount, batch.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--color-muted)]">
                        {batch.paid_count}/{batch.payout_count}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">
                        {formatDate(batch.created_at)}
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={exportingBatchId === batch.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              exportAch(batch.id);
                            }}
                            className="text-xs font-medium text-[var(--color-primary-text)] hover:underline disabled:opacity-50"
                          >
                            {exportingBatchId === batch.id ? "Exporting…" : "ACH CSV"}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                    {expanded ? (
                      <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                        <td colSpan={canManage ? 8 : 7} className="px-4 py-4">
                          {payouts.length === 0 ? (
                            <p className="text-sm text-[var(--color-muted)]">Loading payouts…</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="text-left text-[var(--color-muted)]">
                                <tr>
                                  <th className="pb-2 font-medium">Participant</th>
                                  <th className="pb-2 font-medium text-right">Amount</th>
                                  <th className="pb-2 font-medium">Status</th>
                                  {canManage ? (
                                    <th className="pb-2 font-medium">Reference</th>
                                  ) : null}
                                  {canManage ? (
                                    <th className="pb-2 font-medium text-right">Action</th>
                                  ) : null}
                                </tr>
                              </thead>
                              <tbody>
                                {payouts.map((payout) => (
                                  <tr key={payout.id} className="border-t border-[var(--color-border)]">
                                    <td className="py-2 font-medium">{payout.participant_name}</td>
                                    <td className="py-2 text-right tabular-nums">
                                      {formatMoney(payout.amount, batch.currency)}
                                    </td>
                                    <td className="py-2">
                                      <StatusBadge status={payout.status} />
                                      {payout.paid_at ? (
                                        <span className="block text-xs text-[var(--color-muted)]">
                                          {formatDate(payout.paid_at)}
                                        </span>
                                      ) : null}
                                    </td>
                                    {canManage ? (
                                      <td className="py-2">
                                        {payout.status === "pending" ? (
                                          <input
                                            type="text"
                                            placeholder="ACH-12345"
                                            value={references[payout.id] ?? ""}
                                            onChange={(event) =>
                                              setReferences((current) => ({
                                                ...current,
                                                [payout.id]: event.target.value,
                                              }))
                                            }
                                            className="w-full max-w-[160px] rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs"
                                            onClick={(event) => event.stopPropagation()}
                                          />
                                        ) : (
                                          <span className="text-xs text-[var(--color-muted)]">
                                            {payout.payment_reference || "—"}
                                          </span>
                                        )}
                                      </td>
                                    ) : null}
                                    {canManage ? (
                                      <td className="py-2 text-right">
                                        {payout.status === "pending" ? (
                                          <button
                                            type="button"
                                            disabled={markingId === payout.id}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              markPaid(payout);
                                            }}
                                            className="rounded-md bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                                          >
                                            {markingId === payout.id ? "Saving…" : "Mark paid"}
                                          </button>
                                        ) : (
                                          <span className="text-xs text-[var(--color-muted)] capitalize">
                                            {titleCase(payout.status)}
                                          </span>
                                        )}
                                      </td>
                                    ) : null}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
