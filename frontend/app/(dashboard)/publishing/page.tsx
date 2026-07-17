"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { canAccessPublishing, canManagePublishing, isArtistRole, useAuth } from "@/lib/auth";
import {
  CONTRIBUTOR_ROLES,
  PRO_SOCIETIES,
  REGISTRATION_STATUSES,
  type Artist,
  type ContributorRole,
  type Label,
  type MusicalWork,
  type ProSociety,
  type RegistrationStatus,
  type Track,
  type WorkShare,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const EMPTY_SHARE: WorkShare = {
  contributor_name: "",
  artist: null,
  role: "writer",
  percentage: "",
  ipi_cae: "",
  pro_affiliation: "",
};

export default function PublishingPage() {
  const { token, user } = useAuth();
  const [works, setWorks] = useState<MusicalWork[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    label: "",
    title: "",
    iswc: "",
    registration_status: "draft" as RegistrationStatus,
    target_pro: "" as ProSociety,
    notes: "",
    track_ids: [] as number[],
    shares: [{ ...EMPTY_SHARE }, { ...EMPTY_SHARE }],
  });

  const hasAccess = user && canAccessPublishing(user.role);
  const canManage = user && canManagePublishing(user.role);
  const isArtist = user && isArtistRole(user.role);

  const shareTotal = useMemo(
    () => form.shares.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0),
    [form.shares],
  );

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const workData = await apiFetch<MusicalWork[]>("/api/publishing/works/", {}, token!);
        setWorks(workData);
        if (canManage) {
          const [artistData, trackData, labelData] = await Promise.all([
            apiFetch<Artist[]>("/api/catalog/artists/", {}, token!),
            apiFetch<Track[]>("/api/catalog/tracks/", {}, token!),
            apiFetch<Label[]>("/api/catalog/labels/", {}, token!),
          ]);
          setArtists(artistData);
          setTracks(trackData);
          setLabels(labelData);
          if (labelData.length === 1) {
            setForm((c) => ({ ...c, label: String(labelData[0].id) }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load works.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  function resetForm() {
    setForm({
      label: labels.length === 1 ? String(labels[0].id) : "",
      title: "",
      iswc: "",
      registration_status: "draft",
      target_pro: "",
      notes: "",
      track_ids: [],
      shares: [{ ...EMPTY_SHARE }, { ...EMPTY_SHARE }],
    });
    setShowForm(false);
  }

  function updateShare(index: number, patch: Partial<WorkShare>) {
    setForm((current) => ({
      ...current,
      shares: current.shares.map((share, i) => (i === index ? { ...share, ...patch } : share)),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.title.trim() || !form.label) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<MusicalWork>(
        "/api/publishing/works/",
        {
          method: "POST",
          body: JSON.stringify({
            label: Number(form.label),
            title: form.title.trim(),
            iswc: form.iswc.trim() || null,
            registration_status: form.registration_status,
            target_pro: form.target_pro,
            notes: form.notes.trim(),
            track_ids: form.track_ids,
            shares: form.shares
              .filter((s) => s.contributor_name.trim() && s.percentage)
              .map((s) => ({
                contributor_name: s.contributor_name.trim(),
                artist: s.artist,
                role: s.role,
                percentage: s.percentage,
                ipi_cae: s.ipi_cae.trim(),
                pro_affiliation: s.pro_affiliation,
              })),
          }),
        },
        token,
      );
      setWorks((current) => [created, ...current]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create work.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">You do not have access to publishing.</p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My works" : "Publishing"}
        description={
          isArtist
            ? "Compositions you share on — registration status and writer splits."
            : "Musical works, writer shares, and PRO registration tracking."
        }
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)]"
            >
              {showForm ? "Cancel" : "New work"}
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
          <h2 className="font-semibold">New musical work</h2>
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
              ISWC
              <input
                value={form.iswc}
                onChange={(e) => setForm((c) => ({ ...c, iswc: e.target.value }))}
                className={inputClassName}
                placeholder="T-123.456.789-0"
                maxLength={15}
              />
            </label>
            <label className={labelClassName}>
              Target PRO
              <select
                value={form.target_pro}
                onChange={(e) =>
                  setForm((c) => ({ ...c, target_pro: e.target.value as ProSociety }))
                }
                className={inputClassName}
              >
                {PRO_SOCIETIES.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Registration status
              <select
                value={form.registration_status}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    registration_status: e.target.value as RegistrationStatus,
                  }))
                }
                className={inputClassName}
              >
                {REGISTRATION_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Linked recordings
              <select
                multiple
                value={form.track_ids.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                  setForm((c) => ({ ...c, track_ids: selected }));
                }}
                className={`${inputClassName} min-h-24`}
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title}
                    {track.isrc ? ` (${track.isrc})` : ""}
                  </option>
                ))}
              </select>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Writer / publisher shares</h3>
              <span className="text-xs text-[var(--color-muted)] tabular-nums">
                Total: {shareTotal.toFixed(2)}%
              </span>
            </div>
            {form.shares.map((share, index) => (
              <div
                key={index}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 rounded-lg border border-[var(--color-border)] p-3"
              >
                <label className={labelClassName}>
                  Name
                  <input
                    value={share.contributor_name}
                    onChange={(e) => updateShare(index, { contributor_name: e.target.value })}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Role
                  <select
                    value={share.role}
                    onChange={(e) =>
                      updateShare(index, { role: e.target.value as ContributorRole })
                    }
                    className={inputClassName}
                  >
                    {CONTRIBUTOR_ROLES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  %
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={share.percentage}
                    onChange={(e) => updateShare(index, { percentage: e.target.value })}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  PRO
                  <select
                    value={share.pro_affiliation}
                    onChange={(e) =>
                      updateShare(index, { pro_affiliation: e.target.value as ProSociety })
                    }
                    className={inputClassName}
                  >
                    {PRO_SOCIETIES.map((option) => (
                      <option key={option.value || "none"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  Roster artist
                  <select
                    value={share.artist ?? ""}
                    onChange={(e) =>
                      updateShare(index, {
                        artist: e.target.value ? Number(e.target.value) : null,
                      })
                    }
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
            ))}
            <button
              type="button"
              onClick={() =>
                setForm((c) => ({ ...c, shares: [...c.shares, { ...EMPTY_SHARE }] }))
              }
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              + Add share
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Create work"}
          </button>
        </form>
      ) : null}

      {works.length === 0 ? (
        <EmptyState
          title="No musical works yet"
          description={
            canManage
              ? "Add compositions with writer shares and track PRO registration status."
              : "Works you contribute to will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">ISWC</th>
                <th className="px-4 py-3 font-medium">PRO</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Shares</th>
              </tr>
            </thead>
            <tbody>
              {works.map((work) => (
                <Fragment key={work.id}>
                  <tr
                    className="border-t border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-2)]"
                    onClick={() => setExpandedId((id) => (id === work.id ? null : work.id))}
                  >
                    <td className="px-4 py-3 font-medium">{work.title}</td>
                    <td className="px-4 py-3 font-mono text-xs">{work.iswc || "—"}</td>
                    <td className="px-4 py-3">{work.target_pro_display || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={work.registration_status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {work.total_percentage}%
                    </td>
                  </tr>
                  {expandedId === work.id ? (
                    <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                      <td colSpan={5} className="px-4 py-4">
                        {work.track_titles.length > 0 ? (
                          <p className="text-xs text-[var(--color-muted)] mb-3">
                            Recordings: {work.track_titles.join(", ")}
                          </p>
                        ) : null}
                        <table className="w-full text-xs">
                          <thead className="text-left text-[var(--color-muted)]">
                            <tr>
                              <th className="pb-2 font-medium">Contributor</th>
                              <th className="pb-2 font-medium">Role</th>
                              <th className="pb-2 font-medium">PRO</th>
                              <th className="pb-2 font-medium text-right">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {work.shares.map((share, i) => (
                              <tr key={share.id ?? i}>
                                <td className="py-1">{share.contributor_name}</td>
                                <td className="py-1">{share.role_display}</td>
                                <td className="py-1">{share.pro_affiliation_display || "—"}</td>
                                <td className="py-1 text-right tabular-nums">
                                  {share.percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
