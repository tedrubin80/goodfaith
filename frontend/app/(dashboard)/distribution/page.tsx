"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import {
  canAccessDistribution,
  canManageDistribution,
  isArtistRole,
  useAuth,
} from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  DELIVERY_STATUSES,
  DSP_TARGETS,
  type DeliveryStatus,
  type DspDelivery,
  type DspTarget,
  type Release,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const emptyForm = {
  label: "",
  release: "",
  dsp: "spotify" as DspTarget,
  status: "planned" as DeliveryStatus,
  distributor: "",
  target_live_date: "",
  submitted_at: "",
  live_at: "",
  store_url: "",
  notes: "",
};

export default function DistributionPage() {
  const { token, user } = useAuth();
  const [deliveries, setDeliveries] = useState<DspDelivery[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form, setForm] = useState(emptyForm);

  const hasAccess = user && canAccessDistribution(user.role);
  const canManage = user && canManageDistribution(user.role);
  const isArtist = user && isArtistRole(user.role);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const status of DELIVERY_STATUSES) counts.set(status.value, 0);
    for (const delivery of deliveries) {
      counts.set(delivery.status, (counts.get(delivery.status) ?? 0) + 1);
    }
    return counts;
  }, [deliveries]);

  const filtered = useMemo(() => {
    const list = statusFilter
      ? deliveries.filter((d) => d.status === statusFilter)
      : deliveries;
    return [...list].sort((a, b) => {
      const aDate = a.target_live_date ?? "";
      const bDate = b.target_live_date ?? "";
      return aDate.localeCompare(bDate);
    });
  }, [deliveries, statusFilter]);

  function resetForm(labelId?: string) {
    setForm({
      ...emptyForm,
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(delivery: DspDelivery) {
    setEditingId(delivery.id);
    setForm({
      label: String(delivery.label),
      release: String(delivery.release),
      dsp: delivery.dsp,
      status: delivery.status,
      distributor: delivery.distributor ?? "",
      target_live_date: delivery.target_live_date ?? "",
      submitted_at: delivery.submitted_at ?? "",
      live_at: delivery.live_at ?? "",
      store_url: delivery.store_url ?? "",
      notes: delivery.notes ?? "",
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
        const deliveryData = await apiFetch<DspDelivery[]>(
          "/api/distribution/deliveries/",
          {},
          token!,
        );
        setDeliveries(deliveryData);
        if (canManage) {
          const [releaseData, labelData] = await Promise.all([
            apiFetch<Release[]>("/api/catalog/releases/", {}, token!),
            apiFetch<{ id: number; name: string }[]>("/api/catalog/labels/", {}, token!),
          ]);
          setReleases(releaseData);
          setLabels(labelData);
          if (labelData.length === 1) {
            setForm((current) => ({ ...current, label: String(labelData[0].id) }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deliveries.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.label || !form.release) return;

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      label: Number(form.label),
      release: Number(form.release),
      dsp: form.dsp,
      status: form.status,
      distributor: form.distributor.trim(),
      target_live_date: form.target_live_date || null,
      submitted_at: form.submitted_at || null,
      live_at: form.live_at || null,
      store_url: form.store_url.trim(),
      notes: form.notes.trim(),
    };

    try {
      const saved = editingId
        ? await apiFetch<DspDelivery>(
            `/api/distribution/deliveries/${editingId}/`,
            { method: "PATCH", body: JSON.stringify(payload) },
            token,
          )
        : await apiFetch<DspDelivery>(
            "/api/distribution/deliveries/",
            { method: "POST", body: JSON.stringify(payload) },
            token,
          );
      setDeliveries((current) =>
        editingId
          ? current.map((d) => (d.id === saved.id ? saved : d))
          : [saved, ...current],
      );
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save delivery.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to distribution deliveries.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My deliveries" : "Distribution"}
        description="DSP delivery calendar — track planned, submitted, and live store dates by release."
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
              {showForm ? "Cancel" : "New delivery"}
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
          All ({deliveries.length})
        </button>
        {DELIVERY_STATUSES.map((status) => (
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
          <h2 className="font-semibold">{editingId ? "Edit delivery" : "New delivery"}</h2>
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
              Release
              <select
                required
                value={form.release}
                onChange={(e) => setForm((c) => ({ ...c, release: e.target.value }))}
                className={inputClassName}
              >
                <option value="">Select release</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              DSP
              <select
                value={form.dsp}
                onChange={(e) => setForm((c) => ({ ...c, dsp: e.target.value as DspTarget }))}
                className={inputClassName}
              >
                {DSP_TARGETS.map((option) => (
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
                  setForm((c) => ({ ...c, status: e.target.value as DeliveryStatus }))
                }
                className={inputClassName}
              >
                {DELIVERY_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Distributor
              <input
                value={form.distributor}
                onChange={(e) => setForm((c) => ({ ...c, distributor: e.target.value }))}
                placeholder="DistroKid, FUGA…"
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Target live date
              <input
                type="date"
                value={form.target_live_date}
                onChange={(e) => setForm((c) => ({ ...c, target_live_date: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Submitted
              <input
                type="date"
                value={form.submitted_at}
                onChange={(e) => setForm((c) => ({ ...c, submitted_at: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Live date
              <input
                type="date"
                value={form.live_at}
                onChange={(e) => setForm((c) => ({ ...c, live_at: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Store URL
              <input
                type="url"
                value={form.store_url}
                onChange={(e) => setForm((c) => ({ ...c, store_url: e.target.value }))}
                className={inputClassName}
              />
            </label>
          </div>
          <label className={labelClassName}>
            Notes
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
              className={inputClassName}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : editingId ? "Save changes" : "Add delivery"}
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

      {filtered.length === 0 ? (
        <EmptyState
          title={statusFilter ? "No deliveries in this status" : "No DSP deliveries yet"}
          description={
            canManage
              ? "Plan store live dates per DSP and track submission through take-down."
              : "Deliveries for your releases will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Target live</th>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">DSP</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Distributor</th>
                <th className="px-4 py-3 font-medium">Store</th>
                {canManage ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((delivery) => (
                <tr key={delivery.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {formatDate(delivery.target_live_date)}
                  </td>
                  <td className="px-4 py-3">{delivery.release_title}</td>
                  <td className="px-4 py-3">{delivery.dsp_display}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={delivery.status_display} status={delivery.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {delivery.distributor || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {delivery.store_url ? (
                      <a
                        href={delivery.store_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                      >
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(delivery)}
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
