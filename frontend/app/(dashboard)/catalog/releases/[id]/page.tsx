"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDuration, titleCase } from "@/lib/format";
import type { Release } from "@/lib/types";

export default function ReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.id) return;
    setLoading(true);
    apiFetch<Release>(`/api/catalog/releases/${params.id}/`, {}, token)
      .then(setRelease)
      .catch((err) => setError(err instanceof Error ? err.message : "Release not found."))
      .finally(() => setLoading(false));
  }, [token, params.id]);

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading release…</p>;
  }

  if (error || !release) {
    return (
      <div>
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error ?? "Release not found."}
        </p>
        <Link href="/catalog" className="inline-block mt-4 text-sm text-[var(--color-primary-text)]">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/catalog"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        ← Catalog
      </Link>

      <PageHeader
        title={release.title}
        description={`${release.primary_artist_name} · ${titleCase(release.release_type)} · ${formatDate(release.release_date)}`}
      />

      <dl className="grid gap-4 sm:grid-cols-3 mb-8 text-sm">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-[var(--color-muted)]">UPC / EAN</dt>
          <dd className="mt-1 font-mono">{release.upc ?? "—"}</dd>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-[var(--color-muted)]">Tracks</dt>
          <dd className="mt-1 font-semibold tabular-nums">{release.track_count}</dd>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-[var(--color-muted)]">Release type</dt>
          <dd className="mt-1 capitalize">{titleCase(release.release_type)}</dd>
        </div>
      </dl>

      <h2 className="text-lg font-semibold mb-4">Track listing</h2>
      {release.tracks.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No tracks on this release.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">ISRC</th>
                <th className="px-4 py-3 font-medium text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {release.tracks.map((track) => (
                <tr key={track.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 tabular-nums text-[var(--color-muted)]">
                    {track.track_number}
                  </td>
                  <td className="px-4 py-3 font-medium">{track.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{track.isrc ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatDuration(track.duration_seconds)}
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
