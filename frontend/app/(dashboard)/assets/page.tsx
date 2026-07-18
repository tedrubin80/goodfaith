"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError, API_URL, apiFetch } from "@/lib/api";
import { canAccessDAM, canManageDAM, isArtistRole, useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import {
  ASSET_TYPES,
  type Artist,
  type AssetType,
  type DigitalAsset,
  type Release,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const emptyForm = {
  label: "",
  artist: "",
  release: "",
  asset_type: "master" as AssetType,
  title: "",
  version_label: "",
  notes: "",
  file: null as File | null,
};

export default function AssetsPage() {
  const { token, user } = useAuth();
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const hasAccess = user && canAccessDAM(user.role);
  const canManage = user && canManageDAM(user.role);
  const isArtist = user && isArtistRole(user.role);

  function resetForm(labelId?: string) {
    setForm({
      ...emptyForm,
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
    });
    setShowForm(false);
  }

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const assetData = await apiFetch<DigitalAsset[]>("/api/dam/assets/", {}, token!);
        setAssets(assetData);
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
        setError(err instanceof Error ? err.message : "Failed to load assets.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.label || !form.title.trim() || !form.file) return;

    setSubmitting(true);
    setError(null);

    const body = new FormData();
    body.set("label", form.label);
    body.set("title", form.title.trim());
    body.set("asset_type", form.asset_type);
    body.set("version_label", form.version_label.trim());
    body.set("notes", form.notes.trim());
    if (form.artist) body.set("artist", form.artist);
    if (form.release) body.set("release", form.release);
    body.set("file", form.file);

    try {
      const response = await fetch(`${API_URL}/api/dam/assets/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body,
      });
      if (!response.ok) {
        let message = "Could not upload asset.";
        try {
          const payload = (await response.json()) as Record<string, unknown>;
          if (typeof payload.detail === "string") message = payload.detail;
        } catch {
          // ignore
        }
        throw new ApiError(message, response.status);
      }
      const saved = (await response.json()) as DigitalAsset;
      setAssets((current) => [saved, ...current]);
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload asset.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to digital assets.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My assets" : "Assets"}
        description="Masters, stems, artwork, and documents linked to artists and releases."
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => {
                if (showForm) resetForm(form.label || undefined);
                else setShowForm(true);
              }}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)]"
            >
              {showForm ? "Cancel" : "Upload asset"}
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
          <h2 className="font-semibold">Upload asset</h2>
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
              Type
              <select
                value={form.asset_type}
                onChange={(e) =>
                  setForm((c) => ({ ...c, asset_type: e.target.value as AssetType }))
                }
                className={inputClassName}
              >
                {ASSET_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Version label
              <input
                value={form.version_label}
                onChange={(e) => setForm((c) => ({ ...c, version_label: e.target.value }))}
                placeholder="Mastered v3, Cover 3000px…"
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
                <option value="">None</option>
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
                <option value="">None</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClassName}>
            File
            <input
              required
              type="file"
              onChange={(e) => setForm((c) => ({ ...c, file: e.target.files?.[0] ?? null }))}
              className="mt-1 block w-full text-sm"
            />
          </label>
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
            {submitting ? "Uploading…" : "Upload"}
          </button>
        </form>
      ) : null}

      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          description={
            canManage
              ? "Upload masters, stems, artwork, and documents for the catalog."
              : "Assets linked to you will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Artist / Release</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium">File</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium">{asset.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={asset.asset_type_display}
                      status={asset.asset_type}
                    />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    <div>{asset.artist_name || "—"}</div>
                    {asset.release_title ? (
                      <div className="text-xs">{asset.release_title}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {asset.version_label || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {formatDateTime(asset.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {asset.file_url ? (
                      <a
                        href={asset.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                      >
                        Download
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
