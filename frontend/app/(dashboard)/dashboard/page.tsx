"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canAccessRoyalties, useAuth } from "@/lib/auth";
import type { Release, RoyaltyStatement } from "@/lib/types";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);

  useEffect(() => {
    if (!token) return;

    apiFetch<Release[]>("/api/catalog/releases/", {}, token)
      .then(setReleases)
      .catch(() => setReleases([]));

    if (user && canAccessRoyalties(user.role)) {
      apiFetch<RoyaltyStatement[]>("/api/royalties/statements/", {}, token)
        .then(setStatements)
        .catch(() => setStatements([]));
    }
  }, [token, user]);

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.first_name ? `, ${user.first_name}` : ""}`}
        description="Your label at a glance — catalog releases and royalty statement activity."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Catalog</h2>
            <Link
              href="/catalog"
              className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
            >
              View all
            </Link>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{releases.length}</p>
          <p className="text-sm text-[var(--color-muted)]">releases in catalog</p>
        </section>

        {user && canAccessRoyalties(user.role) ? (
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Royalties</h2>
              <Link
                href="/royalties"
                className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
              >
                View all
              </Link>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {statements.length}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              distributor statements uploaded
            </p>
          </section>
        ) : (
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-semibold">Royalties</h2>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Royalty data is limited to Finance and Manager roles.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
