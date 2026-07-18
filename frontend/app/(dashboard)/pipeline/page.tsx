"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { canAccessARPipeline, canManageARPipeline, useAuth } from "@/lib/auth";
import {
  PIPELINE_STAGES,
  PROSPECT_PRIORITIES,
  type Artist,
  type PipelineStage,
  type Prospect,
  type ProspectPriority,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const emptyForm = {
  label: "",
  name: "",
  stage: "lead" as PipelineStage,
  priority: "medium" as ProspectPriority,
  genre: "",
  location: "",
  contact_email: "",
  contact_phone: "",
  spotify_url: "",
  instagram_url: "",
  other_links: "",
  source: "",
  notes: "",
  assigned_to: "",
  signed_artist: "",
};

export default function PipelinePage() {
  const { token, user } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("");
  const [form, setForm] = useState(emptyForm);

  const hasAccess = user && canAccessARPipeline(user.role);
  const canManage = user && canManageARPipeline(user.role);

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stage of PIPELINE_STAGES) counts.set(stage.value, 0);
    for (const prospect of prospects) {
      counts.set(prospect.stage, (counts.get(prospect.stage) ?? 0) + 1);
    }
    return counts;
  }, [prospects]);

  const filtered = useMemo(() => {
    if (!stageFilter) return prospects;
    return prospects.filter((p) => p.stage === stageFilter);
  }, [prospects, stageFilter]);

  function resetForm(labelId?: string) {
    setForm({
      ...emptyForm,
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(prospect: Prospect) {
    setEditingId(prospect.id);
    setForm({
      label: String(prospect.label),
      name: prospect.name,
      stage: prospect.stage,
      priority: prospect.priority,
      genre: prospect.genre ?? "",
      location: prospect.location ?? "",
      contact_email: prospect.contact_email ?? "",
      contact_phone: prospect.contact_phone ?? "",
      spotify_url: prospect.spotify_url ?? "",
      instagram_url: prospect.instagram_url ?? "",
      other_links: prospect.other_links ?? "",
      source: prospect.source ?? "",
      notes: prospect.notes ?? "",
      assigned_to: prospect.assigned_to ? String(prospect.assigned_to) : "",
      signed_artist: prospect.signed_artist ? String(prospect.signed_artist) : "",
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
        const prospectData = await apiFetch<Prospect[]>("/api/ar/prospects/", {}, token!);
        setProspects(prospectData);
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
        setError(err instanceof Error ? err.message : "Failed to load pipeline.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.name.trim() || !form.label) return;

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      label: Number(form.label),
      name: form.name.trim(),
      stage: form.stage,
      priority: form.priority,
      genre: form.genre.trim(),
      location: form.location.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim(),
      spotify_url: form.spotify_url.trim(),
      instagram_url: form.instagram_url.trim(),
      other_links: form.other_links.trim(),
      source: form.source.trim(),
      notes: form.notes.trim(),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      signed_artist: form.signed_artist ? Number(form.signed_artist) : null,
    };

    try {
      const saved = editingId
        ? await apiFetch<Prospect>(
            `/api/ar/prospects/${editingId}/`,
            { method: "PATCH", body: JSON.stringify(payload) },
            token,
          )
        : await apiFetch<Prospect>(
            "/api/ar/prospects/",
            { method: "POST", body: JSON.stringify(payload) },
            token,
          );
      setProspects((current) =>
        editingId
          ? current.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...current],
      );
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save prospect.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to the A&R pipeline.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title="A&R Pipeline"
        description="Track unsigned talent from first listen through signing — no financial data in this view."
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
              {showForm ? "Cancel" : "New prospect"}
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
          onClick={() => setStageFilter("")}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium border",
            !stageFilter
              ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
              : "border-[var(--color-border)] text-[var(--color-muted)]",
          ].join(" ")}
        >
          All ({prospects.length})
        </button>
        {PIPELINE_STAGES.map((stage) => (
          <button
            key={stage.value}
            type="button"
            onClick={() => setStageFilter(stage.value)}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium border",
              stageFilter === stage.value
                ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]",
            ].join(" ")}
          >
            {stage.label} ({stageCounts.get(stage.value) ?? 0})
          </button>
        ))}
      </div>

      {showForm && canManage ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">{editingId ? "Edit prospect" : "New prospect"}</h2>
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
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Stage
              <select
                value={form.stage}
                onChange={(e) =>
                  setForm((c) => ({ ...c, stage: e.target.value as PipelineStage }))
                }
                className={inputClassName}
              >
                {PIPELINE_STAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Priority
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((c) => ({ ...c, priority: e.target.value as ProspectPriority }))
                }
                className={inputClassName}
              >
                {PROSPECT_PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Genre
              <input
                value={form.genre}
                onChange={(e) => setForm((c) => ({ ...c, genre: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Location
              <input
                value={form.location}
                onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Email
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((c) => ({ ...c, contact_email: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Phone
              <input
                value={form.contact_phone}
                onChange={(e) => setForm((c) => ({ ...c, contact_phone: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Spotify URL
              <input
                type="url"
                value={form.spotify_url}
                onChange={(e) => setForm((c) => ({ ...c, spotify_url: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Instagram URL
              <input
                type="url"
                value={form.instagram_url}
                onChange={(e) => setForm((c) => ({ ...c, instagram_url: e.target.value }))}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Source
              <input
                value={form.source}
                onChange={(e) => setForm((c) => ({ ...c, source: e.target.value }))}
                placeholder="Demo, referral, showcase…"
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Linked roster artist (when signed)
              <select
                value={form.signed_artist}
                onChange={(e) => setForm((c) => ({ ...c, signed_artist: e.target.value }))}
                className={inputClassName}
              >
                <option value="">None</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClassName}>
            Other links
            <textarea
              rows={2}
              value={form.other_links}
              onChange={(e) => setForm((c) => ({ ...c, other_links: e.target.value }))}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Notes
            <textarea
              rows={3}
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
            {submitting ? "Saving…" : editingId ? "Save changes" : "Add prospect"}
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
          title={stageFilter ? "No prospects in this stage" : "No prospects yet"}
          description={
            canManage
              ? "Add leads from demos, showcases, and referrals. Move them through the pipeline as conversations progress."
              : "Prospects added by A&R or managers will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Genre</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Links</th>
                {canManage ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((prospect) => (
                <tr key={prospect.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium">
                    <div>{prospect.name}</div>
                    {prospect.signed_artist_name ? (
                      <div className="text-xs text-[var(--color-muted)]">
                        Roster: {prospect.signed_artist_name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={prospect.stage_display} status={prospect.stage} />
                  </td>
                  <td className="px-4 py-3">{prospect.priority_display}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {prospect.genre || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {prospect.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {prospect.source || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    <div className="flex flex-wrap gap-2">
                      {prospect.spotify_url ? (
                        <a
                          href={prospect.spotify_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                        >
                          Spotify
                        </a>
                      ) : null}
                      {prospect.instagram_url ? (
                        <a
                          href={prospect.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                        >
                          Instagram
                        </a>
                      ) : null}
                      {!prospect.spotify_url && !prospect.instagram_url ? "—" : null}
                    </div>
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(prospect)}
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
