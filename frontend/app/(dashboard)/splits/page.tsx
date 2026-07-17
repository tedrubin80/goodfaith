"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { canAccessSplits, canManageSplits, useAuth } from "@/lib/auth";
import type { SplitEntry, SplitSheet, Track } from "@/lib/types";
import { SPLIT_ROLES } from "@/lib/types";

const EMPTY_ENTRY: SplitEntry = {
  participant_name: "",
  artist: null,
  role: "artist",
  percentage: "",
};

export default function SplitsPage() {
  const { token, user } = useAuth();
  const [sheets, setSheets] = useState<SplitSheet[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    track: "",
    status: "draft" as "draft" | "finalized",
    notes: "",
    entries: [{ ...EMPTY_ENTRY }, { ...EMPTY_ENTRY }],
  });

  const hasAccess = user && canAccessSplits(user.role);
  const canManage = user && canManageSplits(user.role);

  const sheetTrackIds = useMemo(
    () => new Set(sheets.map((sheet) => sheet.track)),
    [sheets],
  );

  const availableTracks = useMemo(
    () => tracks.filter((track) => !sheetTrackIds.has(track.id)),
    [tracks, sheetTrackIds],
  );

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiFetch<SplitSheet[]>("/api/splits/sheets/", {}, token),
      canManage
        ? apiFetch<Track[]>("/api/catalog/tracks/", {}, token)
        : Promise.resolve([] as Track[]),
    ])
      .then(([sheetData, trackData]) => {
        setSheets(sheetData);
        setTracks(trackData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load split sheets."),
      )
      .finally(() => setLoading(false));
  }, [token, hasAccess, canManage]);

  function updateEntry(index: number, patch: Partial<SplitEntry>) {
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function addEntry() {
    setForm((current) => ({
      ...current,
      entries: [...current.entries, { ...EMPTY_ENTRY }],
    }));
  }

  function removeEntry(index: number) {
    setForm((current) => ({
      ...current,
      entries: current.entries.filter((_, i) => i !== index),
    }));
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !form.track) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await apiFetch<SplitSheet>(
        "/api/splits/sheets/",
        {
          method: "POST",
          body: JSON.stringify({
            track: Number(form.track),
            status: form.status,
            notes: form.notes,
            entries: form.entries
              .filter((entry) => entry.participant_name && entry.percentage)
              .map((entry) => ({
                participant_name: entry.participant_name,
                artist: entry.artist,
                role: entry.role,
                percentage: entry.percentage,
              })),
          }),
        },
        token,
      );
      setSheets((current) => [created, ...current]);
      setShowForm(false);
      setForm({
        track: "",
        status: "draft",
        notes: "",
        entries: [{ ...EMPTY_ENTRY }, { ...EMPTY_ENTRY }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create split sheet.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <EmptyState
        title="Splits are restricted"
        description="A&R roles cannot access split sheet data. Artists see splits on their own tracks; managers and finance manage all sheets."
      />
    );
  }

  const formTotal = form.entries.reduce(
    (sum, entry) => sum + (Number(entry.percentage) || 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Splits"
        description="Track-level master recording splits. Percentages must total 100% before a sheet can be finalized."
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center rounded-md bg-[var(--color-primary-fill)] px-3 py-2 text-sm font-semibold text-[var(--color-on-fill)] hover:opacity-90"
            >
              {showForm ? "Cancel" : "New split sheet"}
            </button>
          ) : null
        }
      />

      {error ? (
        <p className="mb-6 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {showForm && canManage ? (
        <section className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Create split sheet</h2>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="split-track" className="block text-sm font-medium mb-1.5">
                  Track
                </label>
                <select
                  id="split-track"
                  required
                  value={form.track}
                  onChange={(e) => setForm({ ...form, track: e.target.value })}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Select track</option>
                  {availableTracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.title}
                      {track.isrc ? ` (${track.isrc})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="split-status" className="block text-sm font-medium mb-1.5">
                  Status
                </label>
                <select
                  id="split-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "draft" | "finalized",
                    })
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="finalized">Finalized</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Participants</h3>
                <button
                  type="button"
                  onClick={addEntry}
                  className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                >
                  Add row
                </button>
              </div>
              {form.entries.map((entry, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-[1fr_8rem_6rem_auto] items-end"
                >
                  <div>
                    <label className="block text-xs text-[var(--color-muted)] mb-1">
                      Name
                    </label>
                    <input
                      value={entry.participant_name}
                      onChange={(e) =>
                        updateEntry(index, { participant_name: e.target.value })
                      }
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-muted)] mb-1">
                      Role
                    </label>
                    <select
                      value={entry.role}
                      onChange={(e) =>
                        updateEntry(index, {
                          role: e.target.value as SplitEntry["role"],
                        })
                      }
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    >
                      {SPLIT_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-muted)] mb-1">
                      %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={entry.percentage}
                      onChange={(e) =>
                        updateEntry(index, { percentage: e.target.value })
                      }
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    disabled={form.entries.length <= 1}
                    className="rounded-md px-2 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <p className="text-xs text-[var(--color-muted)]">
                Total: {formTotal.toFixed(2)}%
                {form.status === "finalized" && formTotal !== 100
                  ? " — must equal 100% to finalize"
                  : ""}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !form.track}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-fill)] hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save split sheet"}
            </button>
          </form>
        </section>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Loading split sheets…</p>
      ) : sheets.length === 0 ? (
        <EmptyState
          title="No split sheets yet"
          description="Define who earns what on each track. Split sheets feed royalty runs and artist payouts."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Track</th>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">Artist</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map((sheet) => (
                <Fragment key={sheet.id}>
                  <tr
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)] cursor-pointer"
                    onClick={() =>
                      setExpandedId((current) =>
                        current === sheet.id ? null : sheet.id,
                      )
                    }
                  >
                    <td className="px-4 py-3 font-medium">
                      {sheet.track_title}
                      {sheet.track_isrc ? (
                        <span className="block text-xs font-mono text-[var(--color-muted)]">
                          {sheet.track_isrc}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{sheet.release_title}</td>
                    <td className="px-4 py-3">{sheet.primary_artist_name}</td>
                    <td className="px-4 py-3 capitalize">{sheet.status}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {sheet.total_percentage}%
                    </td>
                  </tr>
                  {expandedId === sheet.id ? (
                    <tr className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                      <td colSpan={5} className="px-4 py-4">
                        <table className="w-full text-xs">
                          <thead className="text-[var(--color-muted)]">
                            <tr>
                              <th className="pb-2 text-left font-medium">Participant</th>
                              <th className="pb-2 text-left font-medium">Role</th>
                              <th className="pb-2 text-right font-medium">Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.entries.map((entry) => (
                              <tr key={entry.id ?? entry.participant_name}>
                                <td className="py-1">{entry.participant_name}</td>
                                <td className="py-1 capitalize">
                                  {entry.role_display ?? entry.role}
                                </td>
                                <td className="py-1 text-right tabular-nums">
                                  {entry.percentage}%
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
