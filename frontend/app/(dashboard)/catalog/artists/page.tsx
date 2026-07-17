"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canManageCatalog, useAuth } from "@/lib/auth";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  inputClassName,
  labelClassName,
  slugify,
} from "@/lib/catalog-form";
import type { Artist, Label } from "@/lib/types";

export default function ArtistsPage() {
  const { token, user } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ label: "", name: "", slug: "" });

  const canManage = user && canManageCatalog(user.role);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<Artist[]>("/api/catalog/artists/", {}, token),
      canManage ? apiFetch<Label[]>("/api/catalog/labels/", {}, token) : Promise.resolve([]),
    ])
      .then(([artistData, labelData]) => {
        setArtists(artistData);
        setLabels(labelData);
        if (labelData.length === 1) {
          setForm((current) => ({ ...current, label: String(labelData[0].id) }));
        }
      })
      .finally(() => setLoading(false));
  }, [token, canManage]);

  function resetForm() {
    setForm({
      label: labels.length === 1 ? String(labels[0].id) : "",
      name: "",
      slug: "",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(artist: Artist) {
    setEditingId(artist.id);
    setForm({
      label: String(artist.label),
      name: artist.name,
      slug: artist.slug,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.label || !form.name) return;

    setSubmitting(true);
    setError(null);
    const body: Record<string, string | number> = {
      label: Number(form.label),
      name: form.name.trim(),
    };
    if (form.slug.trim()) body.slug = slugify(form.slug.trim());

    try {
      if (editingId) {
        const updated = await apiFetch<Artist>(
          `/api/catalog/artists/${editingId}/`,
          { method: "PATCH", body: JSON.stringify(body) },
          token,
        );
        setArtists((current) => current.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await apiFetch<Artist>(
          "/api/catalog/artists/",
          { method: "POST", body: JSON.stringify(body) },
          token,
        );
        setArtists((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save artist.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Artists"
        description="Signed roster artists on your label."
        action={
          <div className="flex gap-2">
            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  if (showForm && !editingId) resetForm();
                  else {
                    setEditingId(null);
                    setShowForm((v) => !v);
                  }
                }}
                className={buttonPrimaryClassName}
              >
                {showForm && !editingId ? "Cancel" : "Add artist"}
              </button>
            ) : null}
            <Link
              href="/catalog"
              className={buttonSecondaryClassName}
            >
              View releases
            </Link>
          </div>
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {canManage && showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">{editingId ? "Edit artist" : "New artist"}</h2>
          {labels.length > 1 ? (
            <label className={labelClassName}>
              Label
              <select
                required
                value={form.label}
                onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))}
                className={inputClassName}
              >
                <option value="">Select label…</option>
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
              onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
              className={inputClassName}
              placeholder="Artist display name"
            />
          </label>
          <label className={labelClassName}>
            Slug
            <input
              value={form.slug}
              onChange={(event) => setForm((c) => ({ ...c, slug: event.target.value }))}
              className={inputClassName}
              placeholder={form.name ? slugify(form.name) : "auto-generated if blank"}
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={buttonPrimaryClassName}>
              {submitting ? "Saving…" : editingId ? "Save changes" : "Create artist"}
            </button>
            <button type="button" onClick={resetForm} className={buttonSecondaryClassName}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading artists…</p>
      ) : artists.length === 0 ? (
        <EmptyState
          title="No artists yet"
          description={
            canManage
              ? "Add your first artist to start building the catalog."
              : "Add artists to your label to start building the catalog."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <article
              key={artist.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{artist.name}</h2>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => startEdit(artist)}
                    className="text-xs font-medium text-[var(--color-primary-text)] hover:underline shrink-0"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)] font-mono">{artist.slug}</p>
              {artist.user ? (
                <p className="mt-3 text-xs text-[var(--color-accent-text)] font-medium">
                  Portal access enabled
                </p>
              ) : (
                <p className="mt-3 text-xs text-[var(--color-muted)]">No portal login linked</p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
