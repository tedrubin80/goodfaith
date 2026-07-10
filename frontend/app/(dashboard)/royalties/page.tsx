"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { canAccessRoyalties, useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { DISTRIBUTORS, type Label, type RoyaltyRun, type RoyaltyStatement } from "@/lib/types";

export default function RoyaltiesPage() {
  const { token, user } = useAuth();
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [runs, setRuns] = useState<RoyaltyRun[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    distributor: "distrokid",
    period_start: "",
    period_end: "",
    file: null as File | null,
  });

  const hasAccess = user && canAccessRoyalties(user.role);

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiFetch<RoyaltyStatement[]>("/api/royalties/statements/", {}, token),
      apiFetch<RoyaltyRun[]>("/api/royalties/runs/", {}, token),
      apiFetch<Label[]>("/api/catalog/labels/", {}, token),
    ])
      .then(([statementData, runData, labelData]) => {
        setStatements(statementData);
        setRuns(runData);
        setLabels(labelData);
        if (labelData.length === 1) {
          setForm((current) => ({ ...current, label: String(labelData[0].id) }));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load royalty data."),
      )
      .finally(() => setLoading(false));
  }, [token, hasAccess]);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !form.file || !form.label) return;

    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("label", form.label);
    body.append("distributor", form.distributor);
    body.append("file", form.file);
    if (form.period_start) body.append("period_start", form.period_start);
    if (form.period_end) body.append("period_end", form.period_end);

    try {
      const created = await apiFetch<RoyaltyStatement>(
        "/api/royalties/statements/",
        { method: "POST", body },
        token,
      );
      setStatements((current) => [created, ...current]);
      setForm((current) => ({ ...current, file: null, period_start: "", period_end: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (!hasAccess) {
    return (
      <EmptyState
        title="Royalties are restricted"
        description="Finance and Manager roles can upload distributor statements and view royalty runs. Your role does not include financial data access."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Royalties"
        description="Upload statements from every distributor you use. Good Faith normalizes them into one royalty run — no distributor switch required."
      />

      <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Upload statement</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          CSV, TSV, or XLSX from DistroKid, TuneCore, CD Baby, Symphonic, and others.
        </p>

        <form onSubmit={handleUpload} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="label" className="block text-sm font-medium mb-1.5">
              Label
            </label>
            <select
              id="label"
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            >
              <option value="">Select label</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="distributor" className="block text-sm font-medium mb-1.5">
              Distributor
            </label>
            <select
              id="distributor"
              value={form.distributor}
              onChange={(e) => setForm({ ...form, distributor: e.target.value })}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            >
              {DISTRIBUTORS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="period_start" className="block text-sm font-medium mb-1.5">
              Period start
            </label>
            <input
              id="period_start"
              type="date"
              value={form.period_start}
              onChange={(e) => setForm({ ...form, period_start: e.target.value })}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="period_end" className="block text-sm font-medium mb-1.5">
              Period end
            </label>
            <input
              id="period_end"
              type="date"
              value={form.period_end}
              onChange={(e) => setForm({ ...form, period_end: e.target.value })}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="file" className="block text-sm font-medium mb-1.5">
              Statement file
            </label>
            <input
              id="file"
              type="file"
              required
              accept=".csv,.tsv,.xlsx,.xls,.txt"
              onChange={(e) =>
                setForm({ ...form, file: e.target.files?.[0] ?? null })
              }
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[var(--color-primary-fill)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-on-fill)]"
            />
          </div>

          {error ? (
            <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={uploading || !form.file || !form.label}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-fill)] hover:opacity-90 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload statement"}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Royalty runs</h2>
        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No royalty runs yet. Runs combine normalized statements into a single payout cycle.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {runs.map((run) => (
              <article
                key={run.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <h3 className="font-semibold">{run.name}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {run.statement_count} statement{run.statement_count === 1 ? "" : "s"} ·{" "}
                  {formatMoney(run.total_amount, run.currency)}
                </p>
                <p className="mt-1 text-xs capitalize text-[var(--color-muted)]">
                  {run.status}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Uploaded statements</h2>
        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Loading statements…</p>
        ) : statements.length === 0 ? (
          <EmptyState
            title="No statements uploaded"
            description="Upload your first distributor statement above. Each file is auto-detected, normalized, and queued for reconciliation."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Distributor</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((statement) => (
                  <tr
                    key={statement.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-4 py-3 font-medium">{statement.filename}</td>
                    <td className="px-4 py-3">{statement.distributor_display}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(statement.period_start)} – {formatDate(statement.period_end)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={statement.status_display}
                        status={statement.status}
                      />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(statement.total_amount, statement.currency)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(statement.created_at.slice(0, 10))}
                      <span className="block text-xs">{statement.uploaded_by_username}</span>
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
