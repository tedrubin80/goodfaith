"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, API_URL, apiFetch } from "@/lib/api";
import { canAccessContracts, canManageContracts, isArtistRole, useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  type Artist,
  type Contract,
  type ContractStatus,
  type ContractType,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

export default function ContractsPage() {
  const { token, user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    label: "",
    artist: "",
    title: "",
    contract_type: "recording" as ContractType,
    status: "draft" as ContractStatus,
    start_date: "",
    end_date: "",
    term_notes: "",
    file: null as File | null,
  });

  const hasAccess = user && canAccessContracts(user.role);
  const canManage = user && canManageContracts(user.role);
  const isArtist = user && isArtistRole(user.role);

  function resetForm(labelId?: string) {
    setForm({
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
      artist: "",
      title: "",
      contract_type: "recording",
      status: "draft",
      start_date: "",
      end_date: "",
      term_notes: "",
      file: null,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(contract: Contract) {
    setEditingId(contract.id);
    setForm({
      label: String(contract.label),
      artist: contract.artist ? String(contract.artist) : "",
      title: contract.title,
      contract_type: contract.contract_type,
      status: contract.status,
      start_date: contract.start_date ?? "",
      end_date: contract.end_date ?? "",
      term_notes: contract.term_notes ?? "",
      file: null,
    });
    setShowForm(true);
    setError(null);
  }

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const contractData = await apiFetch<Contract[]>("/api/contracts/", {}, token!);
        setContracts(contractData);
        if (canManage) {
          const [artistData, labelData] = await Promise.all([
            apiFetch<Artist[]>("/api/catalog/artists/", {}, token!),
            apiFetch<{ id: number; name: string }[]>("/api/catalog/labels/", {}, token!),
          ]);
          setArtists(artistData);
          setLabels(labelData);
          if (labelData.length === 1) {
            setForm((current) => ({ ...current, label: String(labelData[0].id) }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contracts.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.title.trim() || !form.label) return;

    setSubmitting(true);
    setError(null);

    const body = new FormData();
    body.set("label", form.label);
    body.set("title", form.title.trim());
    body.set("contract_type", form.contract_type);
    body.set("status", form.status);
    if (form.artist) body.set("artist", form.artist);
    else if (editingId) body.set("artist", "");
    if (form.start_date) body.set("start_date", form.start_date);
    if (form.end_date) body.set("end_date", form.end_date);
    body.set("term_notes", form.term_notes.trim());
    if (form.file) body.set("file", form.file);

    try {
      const url = editingId
        ? `${API_URL}/api/contracts/${editingId}/`
        : `${API_URL}/api/contracts/`;
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { Authorization: `Token ${token}` },
        body,
      });
      if (!response.ok) {
        let message = editingId ? "Could not update contract." : "Could not create contract.";
        try {
          const payload = (await response.json()) as Record<string, unknown>;
          if (typeof payload.detail === "string") message = payload.detail;
        } catch {
          // ignore
        }
        throw new ApiError(message, response.status);
      }
      const saved = (await response.json()) as Contract;
      setContracts((current) =>
        editingId
          ? current.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...current],
      );
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save contract.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to contracts.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My contracts" : "Contracts"}
        description={
          isArtist
            ? "Recording and licensing deals linked to your artist profile."
            : "Artist deals, licenses, and label agreements in one place."
        }
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => {
                if (showForm) resetForm(form.label || undefined);
                else {
                  setEditingId(null);
                  setShowForm(true);
                }
              }}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)]"
            >
              {showForm ? "Cancel" : "New contract"}
            </button>
          ) : undefined
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {showForm && canManage ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">{editingId ? "Edit contract" : "New contract"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {labels.length > 1 ? (
              <label className={labelClassName}>
                Label
                <select
                  required
                  value={form.label}
                  onChange={(e) => setForm((c) => ({ ...c, label: e.target.value }))}
                  className={inputClassName}
                >
                  <option value="">Select label</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className={labelClassName}>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Artist (optional)
              <select
                value={form.artist}
                onChange={(e) => setForm((c) => ({ ...c, artist: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None / label-wide</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Type
              <select
                value={form.contract_type}
                onChange={(e) =>
                  setForm((c) => ({ ...c, contract_type: e.target.value as ContractType }))
                }
                className={inputClassName}
              >
                {CONTRACT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((c) => ({ ...c, status: e.target.value as ContractStatus }))
                }
                className={inputClassName}
              >
                {CONTRACT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Start date
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((c) => ({ ...c, start_date: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              End date
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((c) => ({ ...c, end_date: e.target.value }))}
                className={inputClassName}
              />
            </label>
          </div>
          <label className={labelClassName}>
            Terms & notes
            <textarea
              rows={3}
              value={form.term_notes}
              onChange={(e) => setForm((c) => ({ ...c, term_notes: e.target.value }))}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Contract file (PDF)
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) =>
                setForm((c) => ({ ...c, file: e.target.files?.[0] ?? null }))
              }
              className="mt-1 block w-full text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create contract"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => resetForm(form.label || undefined)}
              className="ml-2 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          ) : null}
        </form>
      ) : null}

      {contracts.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description={
            canManage
              ? "Add recording deals, sync licenses, and distribution agreements."
              : "Contracts linked to you will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Artist</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">File</th>
                {canManage ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium">{contract.title}</td>
                  <td className="px-4 py-3">{contract.contract_type_display}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {contract.artist_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={contract.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {contract.start_date ? formatDate(contract.start_date) : "—"}
                    {contract.end_date ? ` → ${formatDate(contract.end_date)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {contract.filename || "—"}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(contract)}
                        className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
