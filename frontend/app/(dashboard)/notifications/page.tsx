"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { PortalNotification } from "@/lib/types";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PortalNotification[]>("/api/notifications/", {}, token);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(notification: PortalNotification) {
    if (!token || notification.is_read) return;
    try {
      const updated = await apiFetch<PortalNotification>(
        `/api/notifications/${notification.id}/mark_read/`,
        { method: "POST" },
        token,
      );
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark notification as read.");
    }
  }

  async function markAllRead() {
    if (!token) return;
    setMarkingAll(true);
    setError(null);
    try {
      await apiFetch<{ updated: number }>(
        "/api/notifications/mark_all_read/",
        { method: "POST" },
        token,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="In-app alerts for statement processing and payout status. Email delivery is not enabled yet."
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              disabled={markingAll}
              onClick={markAllRead}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-2)] disabled:opacity-50"
            >
              {markingAll ? "Updating…" : "Mark all read"}
            </button>
          ) : undefined
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading notifications…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You’ll be notified when statements finish processing and when payouts are issued or paid."
        />
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          {items.map((item) => (
            <li
              key={item.id}
              className={[
                "px-4 py-4 sm:px-5",
                item.is_read ? "bg-[var(--color-bg)]" : "bg-[var(--color-surface)]",
              ].join(" ")}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-muted)] mb-1">
                    {item.kind_display} · {formatDateTime(item.created_at)}
                    {!item.is_read ? (
                      <span className="ml-2 font-medium text-[var(--color-primary-text)]">
                        New
                      </span>
                    ) : null}
                  </p>
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.body ? (
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{item.body}</p>
                  ) : null}
                  {item.link_path ? (
                    <Link
                      href={item.link_path}
                      onClick={() => markRead(item)}
                      className="inline-block mt-2 text-sm font-medium text-[var(--color-primary-text)] hover:underline"
                    >
                      Open →
                    </Link>
                  ) : null}
                </div>
                {!item.is_read ? (
                  <button
                    type="button"
                    onClick={() => markRead(item)}
                    className="shrink-0 text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
