"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canAccessAuditLog, useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { AuditEvent } from "@/lib/types";

export default function ActivityPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = user && canAccessAuditLog(user.role);

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    apiFetch<AuditEvent[]>("/api/audit/events/", {}, token)
      .then(setEvents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load activity log."),
      )
      .finally(() => setLoading(false));
  }, [token, hasAccess]);

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        Activity log is limited to Finance and Manager roles.
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Immutable record of royalty, split, and payout changes on your label."
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading activity…</p>
      ) : events.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Financial actions like statement uploads, run consolidation, and payouts will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Summary</th>
                <th className="px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap">
                    {formatDateTime(event.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{event.action_display}</span>
                    <span className="block text-xs text-[var(--color-muted)] font-mono">
                      {event.resource_type} #{event.resource_id}
                    </span>
                  </td>
                  <td className="px-4 py-3">{event.summary}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {event.actor_username ?? "System"}
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
