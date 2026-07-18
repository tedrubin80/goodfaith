"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { canAccessMarketing, canManageMarketing, isArtistRole, useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  type Artist,
  type CampaignStatus,
  type CampaignType,
  type MarketingCampaign,
  type Release,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const emptyForm = {
  label: "",
  title: "",
  status: "draft" as CampaignStatus,
  campaign_type: "release" as CampaignType,
  artist: "",
  release: "",
  start_date: "",
  end_date: "",
  smart_link_url: "",
  channels: "",
  goals: "",
  notes: "",
};

export default function MarketingPage() {
  const { token, user } = useAuth();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form, setForm] = useState(emptyForm);

  const hasAccess = user && canAccessMarketing(user.role);
  const canManage = user && canManageMarketing(user.role);
  const isArtist = user && isArtistRole(user.role);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const status of CAMPAIGN_STATUSES) counts.set(status.value, 0);
    for (const campaign of campaigns) {
      counts.set(campaign.status, (counts.get(campaign.status) ?? 0) + 1);
    }
    return counts;
  }, [campaigns]);

  const filtered = useMemo(() => {
    if (!statusFilter) return campaigns;
    return campaigns.filter((c) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  function resetForm(labelId?: string) {
    setForm({
      ...emptyForm,
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(campaign: MarketingCampaign) {
    setEditingId(campaign.id);
    setForm({
      label: String(campaign.label),
      title: campaign.title,
      status: campaign.status,
      campaign_type: campaign.campaign_type,
      artist: campaign.artist ? String(campaign.artist) : "",
      release: campaign.release ? String(campaign.release) : "",
      start_date: campaign.start_date ?? "",
      end_date: campaign.end_date ?? "",
      smart_link_url: campaign.smart_link_url ?? "",
      channels: campaign.channels ?? "",
      goals: campaign.goals ?? "",
      notes: campaign.notes ?? "",
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
        const campaignData = await apiFetch<MarketingCampaign[]>(
          "/api/marketing/campaigns/",
          {},
          token!,
        );
        setCampaigns(campaignData);
        if (canManage) {
          const [artistData, releaseData, labelData] = await Promise.all([
            apiFetch<Artist[]>("/api/catalog/artists/", {}, token!),
            apiFetch<Release[]>("/api/catalog/releases/", {}, token!),
            apiFetch<{ id: number; name: string }[]>("/api/catalog/labels/", {}, token!),
          ]);
          setArtists(artistData);
          setReleases(releaseData);
          setLabels(labelData);
          if (labelData.length === 1) {
            setForm((current) => ({ ...current, label: String(labelData[0].id) }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaigns.");
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
      campaign_type: form.campaign_type,
      artist: form.artist ? Number(form.artist) : null,
      release: form.release ? Number(form.release) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      smart_link_url: form.smart_link_url.trim(),
      channels: form.channels.trim(),
      goals: form.goals.trim(),
      notes: form.notes.trim(),
    };

    try {
      const saved = editingId
        ? await apiFetch<MarketingCampaign>(
            `/api/marketing/campaigns/${editingId}/`,
            { method: "PATCH", body: JSON.stringify(payload) },
            token,
          )
        : await apiFetch<MarketingCampaign>(
            "/api/marketing/campaigns/",
            { method: "POST", body: JSON.stringify(payload) },
            token,
          );
      setCampaigns((current) =>
        editingId
          ? current.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...current],
      );
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save campaign.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to marketing campaigns.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My campaigns" : "Marketing"}
        description={
          isArtist
            ? "Release and promo campaigns linked to your catalog."
            : "Plan release pushes, playlist pitches, and promo windows — smart links and channels in one place."
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
              {showForm ? "Cancel" : "New campaign"}
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
          All ({campaigns.length})
        </button>
        {CAMPAIGN_STATUSES.map((status) => (
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
          <h2 className="font-semibold">{editingId ? "Edit campaign" : "New campaign"}</h2>
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
              />
            </label>
            <label className={labelClassName}>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((c) => ({ ...c, status: e.target.value as CampaignStatus }))
                }
                className={inputClassName}
              >
                {CAMPAIGN_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Type
              <select
                value={form.campaign_type}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    campaign_type: e.target.value as CampaignType,
                  }))
                }
                className={inputClassName}
              >
                {CAMPAIGN_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              Start
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((c) => ({ ...c, start_date: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              End
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((c) => ({ ...c, end_date: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              Smart link URL
              <input
                type="url"
                value={form.smart_link_url}
                onChange={(e) =>
                  setForm((c) => ({ ...c, smart_link_url: e.target.value }))
                }
                className={inputClassName}
                placeholder="https://…"
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              Channels
              <textarea
                value={form.channels}
                onChange={(e) => setForm((c) => ({ ...c, channels: e.target.value }))}
                className={inputClassName}
                rows={2}
                placeholder="Spotify, Instagram, press list…"
              />
            </label>
            <label className={`${labelClassName} sm:col-span-2`}>
              Goals
              <textarea
                value={form.goals}
                onChange={(e) => setForm((c) => ({ ...c, goals: e.target.value }))}
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
            {submitting ? "Saving…" : editingId ? "Save changes" : "Create campaign"}
          </button>
        </form>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No campaigns"
          description={
            canManage
              ? "Create a release push or playlist pitch to start planning promo."
              : "No campaigns linked to your catalog yet."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-surface-2)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Catalog</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Link</th>
                {canManage ? <th className="px-4 py-3 font-medium" /> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{campaign.title}</div>
                    {campaign.channels ? (
                      <div className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1">
                        {campaign.channels}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={campaign.status_display} status={campaign.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {campaign.campaign_type_display}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {campaign.release_title || campaign.artist_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap">
                    {formatDate(campaign.start_date)}
                    {campaign.end_date ? ` → ${formatDate(campaign.end_date)}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {campaign.smart_link_url ? (
                      <a
                        href={campaign.smart_link_url}
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
                        onClick={() => startEdit(campaign)}
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
