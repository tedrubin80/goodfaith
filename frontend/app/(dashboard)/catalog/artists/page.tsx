"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Artist } from "@/lib/types";

export default function ArtistsPage() {
  const { token } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<Artist[]>("/api/catalog/artists/", {}, token)
      .then(setArtists)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <PageHeader
        title="Artists"
        description="Signed roster artists on your label."
        action={
          <Link
            href="/catalog"
            className="inline-flex items-center rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-surface-2)]"
          >
            View releases
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading artists…</p>
      ) : artists.length === 0 ? (
        <EmptyState
          title="No artists yet"
          description="Add artists to your label to start building the catalog."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <article
              key={artist.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <h2 className="font-semibold">{artist.name}</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)] font-mono">
                {artist.slug}
              </p>
              {artist.user ? (
                <p className="mt-3 text-xs text-[var(--color-accent-text)] font-medium">
                  Portal access enabled
                </p>
              ) : (
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  No portal login linked
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
