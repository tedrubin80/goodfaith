"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { canAccessSync, canManageSync, isArtistRole, useAuth } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import {
  SYNC_MEDIA_TYPES,
  SYNC_STATUSES,
  type Artist,
  type Contract,
  type Release,
  type SyncMediaType,
  type SyncOpportunity,
  type SyncStatus,
  type Track,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const emptyForm = {
  label: "",
  title: "",
  status: "inquiry" as SyncStatus,
  media_type: "other" as SyncMediaType,
  client_name: "",
  supervisor_name: "",
  supervisor_email: "",
  territory: "",
  exclusivity: "",
  fee_amount: "",
  currency: "USD",
  term_notes: "",
  track: "",
  release: "",
  artist: "",
  contract: "",
  pitched_at: "",
  licensed_at: "",
  notes: "",
};

export default function SyncPage() {
  const { token, user } = useAuth();
  const [opportunities, setOpportunities] = useState<SyncOpportunity[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form, setForm] = useState(emptyForm);

  const hasAccess = user && canAccessSync(user.role);
  const canManage = user && canManageSync(user.role);
  const isArtist = user && isArtistRole(user.role);

  const tracks = useMemo(() => {
    const rows: (Track & { release_title: string })[] = [];
    for (const release of releases) {
      for (const track of release.tracks ?? []) {
        rows.push({ ...track, release_title: release.title });
      }
    }
    return rows;
  }, [releases]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const status of SYNC_STATUSES) counts.set(status.value, 0);
    for (const opp of opportunities) {
      counts.set(opp.status, (counts.get(opp.status) ?? 0) + 1);
    }
    return counts;
  }, [opportunities]);

  const filtered = useMemo(() => {
    if (!statusFilter) return opportunities;
    return opportunities.filter((o) => o.status === statusFilter);
  }, [opportunities, statusFilter]);

  function resetForm(labelId?: string) {
    setForm({
      ...emptyForm,
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(opp: SyncOpportunity) {
    setEditingId(opp.id);
    setForm({
      label: String(opp.label),
      title: opp.title,
      status: opp.status,
      media_type: opp.media_type,
      client_name: opp.client_name ?? "",
      supervisor_name: opp.supervisor_name ?? "",
      supervisor_email: opp.supervisor_email ?? "",
      territory: opp.territory ?? "",
      exclusivity: opp.exclusivity ?? "",
      fee_amount: opp.fee_amount ?? "",
      currency: opp.currency || "USD",
      term_notes: opp.term_notes ?? "",
      track: opp.track ? String(opp.track) : "",
      release: opp.release ? String(opp.release) : "",
      artist: opp.artist ? String(opp.artist) : "",
      contract: opp.contract ? String(opp.contract) : "",
      pitched_at: opp.pitched_at ?? "",
      licensed_at: opp.licensed_at ?? "",
      notes: opp.notes ?? "",
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
        const oppData = await apiFetch<SyncOpportunity[]>(
          "/api/sync/opportunities/",
          {},
          token!,
        );
        setOpportunities(oppData);
        if (canManage) {
          const [artistData, releaseData, contractData, labelData] = await Promise.all([
            apiFetch<Artist[]>("/api/catalog/artists/", {}, token!),
            apiFetch<Release[]>("/api/catalog/releases/", {}, token!),
            apiFetch<Contract[]>("/api/contracts/", {}, token!),
            apiFetch<{ id: number; name: string }[]>("/api/catalog/labels/", {}, token!),
          ]);
          setArtists(artistData);
          setReleases(releaseData);
          setContracts(contractData);
          setLabels(labelData);
          if (labelData.length === 1) {
            setForm((current) => ({ ...current, label: String(labelData[0].id) }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sync opportunities.");
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

    const payload: Record<string, unknown> = {
      label: Number(form.label),
      title: form.title.trim(),
      status: form.status,
      media_type: form.media_type,
      client_name: form.client_name.trim(),
      supervisor_name: form.supervisor_name.trim(),
      supervisor_email: form.supervisor_email.trim(),
      territory: form.territory.trim(),
      exclusivity: form.exclusivity.trim(),
      fee_amount: form.fee_amount.trim() || null,
      currency: form.currency.trim() || "USD",
      term_notes: form.term_notes.trim(),
      track: form.track ? Number(form.track) : null,
      release: form.release ? Number(form.release) : null,
      artist: form.artist ? Number(form.artist) : null,
      contract: form.contract ? Number(form.contract) : null,
      pitched_at: form.pitched_at || null,
      licensed_at: form.licensed_at || null,
      notes: form.notes.trim(),
    };

    try {
      const saved = editingId
        ? await apiFetch<SyncOpportunity>(
            `/api/sync/opportunities/${editingId}/`,
            { method: "PATCH", body: JSON.stringify(payload) },
            token,
          )
        : await apiFetch<SyncOpportunity>(
            "/api/sync/opportunities/",
            { method: "POST", body: JSON.stringify(payload) },
            token,
          );
      setOpportunities((current) =>
        editingId
          ? current.map((o) => (o.id === saved.id ? saved : o))
          : [saved, ...current],
      );
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save opportunity.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to sync licensing.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My sync" : "Sync licensing"}
        description={
          isArtist
            ? "Pitches and licenses involving your catalog."
            : "Track pitches from inquiry through clearance and license — fee, territory, and catalog links in one place."
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
              {showForm ? "Cancel" : "New opportunity"}
            </button>
          ) : undefined
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium border",
            !statusFilter
              ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
              : "border-[var(--color-border)] text-[var(--color-muted)]",
          ].join(" ")}
        >
          All ({opportunities.length})
        </button>
        {SYNC_STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => setStatusFilter(status.value)}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium border",
              statusFilter === status.value
                ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]",
            ].join(" ")}
          >
            {status.label} ({statusCounts.get(status.value) ?? 0})
          </button>
        ))}
      </div>

      {showForm && canManage ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">
            {editingId ? "Edit opportunity" : "New opportunity"}
          </h2>
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
            <label className={`${labelClassName} sm:col-span-2`}>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                className={inputClassName}
                placeholder="Netflix S2E4 cold open"
              />
            </label>
            <label className={labelClassName}>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((c) => ({ ...c, status: e.target.value as SyncStatus }))
                }
                className={inputClassName}
              >
                {SYNC_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Media type
              <select
                value={form.media_type}
                onChange={(e) =>
                  setForm((c) => ({ ...c, media_type: e.target.value as SyncMediaType }))
                }
                className={inputClassName}
              >
                {SYNC_MEDIA_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Client
              <input
                value={form.client_name}
                onChange={(e) => setForm((c) => ({ ...c, client_name: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Supervisor
              <input
                value={form.supervisor_name}
                onChange={(e) =>
                  setForm((c) => ({ ...c, supervisor_name: e.target.value }))
                }
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Supervisor email
              <input
                type="email"
                value={form.supervisor_email}
                onChange={(e) =>
                  setForm((c) => ({ ...c, supervisor_email: e.target.value }))
                }
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Territory
              <input
                value={form.territory}
                onChange={(e) => setForm((c) => ({ ...c, territory: e.target.value }))}
                className={inputClassName}
                placeholder="Worldwide"
              />
            </label>
            <label className={labelClassName}>
              Fee
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.fee_amount}
                onChange={(e) => setForm((c) => ({ ...c, fee_amount: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Currency
              <input
                value={form.currency}
                onChange={(e) => setForm((c) => ({ ...c, currency: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Artist
              <select
                value={form.artist}
                onChange={(e) => setForm((c) => ({ ...c, artist: e.target.value }))}
                className={inputClassName}
              >
                <option value="">—</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Release
              <select
                value={form.release}
                onChange={(e) => setForm((c) => ({ ...c, release: e.target.value }))}
                className={inputClassName}
              >
                <option value="">—</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Track
              <select
                value={form.track}
                onChange={(e) => setForm((c) => ({ ...c, track: e.target.value }))}
                className={inputClassName}
              >
                <option value="">—</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title} ({track.release_title})
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Contract
              <select
                value={form.contract}
                onChange={(e) => setForm((c) => ({ ...c, contract: e.target.value }))}
                className={inputClassName}
              >
                <option value="">—</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Pitched
              <input
                type="date"
                value={form.pitched_at}
                onChange={(e) => setForm((c) => ({ ...c, pitched_at: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Licensed
              <input
                type="date"
                value={form.licensed_at}
                onChange={(e) => setForm((c) => ({ ...c, licensed_at: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              Exclusivity
              <input
                value={form.exclusivity}
                onChange={(e) => setForm((c) => ({ ...c, exclusivity: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              Term notes
              <textarea
                value={form.term_notes}
                onChange={(e) => setForm((c) => ({ ...c, term_notes: e.target.value }))}
                className={inputClassName}
                rows={2}
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                className={inputClassName}
                rows={3}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-50"
          >
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create opportunity"}
          </button>
        </form>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No sync opportunities"
          description={
            canManage
              ? "Log a brief or pitch to start tracking clearance and fees."
              : "No sync pitches linked to your catalog yet."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-surface-2)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Media</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Catalog</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Pitched</th>
                {canManage ? <th className="px-4 py-3 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((opp) => (
                <tr
                  key={opp.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{opp.title}</div>
                    {opp.supervisor_name ? (
                      <div className="text-xs text-[var(--color-muted)] mt-0.5">
                        {opp.supervisor_name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={opp.status_display} status={opp.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {opp.media_type_display}
                  </td>
                  <td className="px-4 py-3">{opp.client_name || "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {opp.track_title || opp.release_title || opp.artist_name || "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatMoney(opp.fee_amount, opp.currency)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {formatDate(opp.pitched_at)}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(opp)}
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
