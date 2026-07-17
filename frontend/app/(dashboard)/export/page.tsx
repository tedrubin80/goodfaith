"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ApiError, apiFetch, downloadExport } from "@/lib/api";
import { canAccessRoyalties, useAuth } from "@/lib/auth";
import type { Label } from "@/lib/types";

export default function ExportPage() {
  const { token, user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelId, setLabelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<Label[]>("/api/catalog/labels/", {}, token)
      .then((data) => {
        setLabels(data);
        if (data.length === 1) setLabelId(String(data[0].id));
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load labels."),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDownload(format: "json" | "csv") {
    if (!token) return;
    if (labels.length > 1 && !labelId) {
      setError("Select a label to export.");
      return;
    }

    setDownloading(format);
    setError(null);
    try {
      await downloadExport(format, token, labelId ? Number(labelId) : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed.");
    } finally {
      setDownloading(null);
    }
  }

  const scopeDescription =
    user?.role === "artist"
      ? "Your catalog releases, split sheets, and payout records."
      : user?.role === "ar"
        ? "Catalog data only — artists, releases, and tracks."
        : "Full label data: catalog, splits, royalty statements, runs, and payments.";

  return (
    <>
      <PageHeader
        title="Data export"
        description="Download everything Good Faith holds for your label. JSON for systems; CSV (ZIP) for spreadsheets."
      />

      <section className="max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm text-[var(--color-muted)] mb-6">{scopeDescription}</p>

        {error ? (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Loading…</p>
        ) : (
          <div className="space-y-5">
            {labels.length > 1 ? (
              <label className="block text-sm">
                <span className="font-medium">Label</span>
                <select
                  value={labelId}
                  onChange={(event) => setLabelId(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
                >
                  <option value="">Select label…</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : labels.length === 1 ? (
              <p className="text-sm">
                Exporting: <span className="font-medium">{labels[0].name}</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No labels found for your account.</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!!downloading || labels.length === 0}
                onClick={() => handleDownload("json")}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {downloading === "json" ? "Preparing…" : "Download JSON"}
              </button>
              <button
                type="button"
                disabled={!!downloading || labels.length === 0}
                onClick={() => handleDownload("csv")}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {downloading === "csv" ? "Preparing…" : "Download CSV (ZIP)"}
              </button>
            </div>

            {user && canAccessRoyalties(user.role) ? (
              <p className="text-xs text-[var(--color-muted)]">
                Financial exports include parsed line items and raw distributor row data in JSON.
                Statement source files are not included — request those separately if needed.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
