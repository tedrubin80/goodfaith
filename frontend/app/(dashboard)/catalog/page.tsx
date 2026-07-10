"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, titleCase } from "@/lib/format";
import type { Release } from "@/lib/types";

export default function CatalogPage() {
  const { token } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiFetch<Release[]>("/api/catalog/releases/", {}, token)
      .then(setReleases)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load catalog."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Releases, tracks, and identifiers across your roster."
        action={
          <Link
            href="/catalog/artists"
            className="inline-flex items-center rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-surface-2)]"
          >
            View artists
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading releases…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : releases.length === 0 ? (
        <EmptyState
          title="No releases yet"
          description="Create releases in Django admin or via the API to populate your catalog."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">Artist</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">UPC</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Tracks</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <tr
                  key={release.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/catalog/releases/${release.id}`}
                      className="font-medium text-[var(--color-primary-text)] hover:underline"
                    >
                      {release.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{release.primary_artist_name}</td>
                  <td className="px-4 py-3 capitalize">{titleCase(release.release_type)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{release.upc ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(release.release_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {release.track_count}
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
