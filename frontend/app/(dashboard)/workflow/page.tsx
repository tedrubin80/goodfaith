"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { canAccessWorkflow, canManageWorkflow, isArtistRole, useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Release,
  type ReleaseTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-fill)]";
const labelClassName = "block text-sm font-medium";

const emptyForm = {
  label: "",
  release: "",
  title: "",
  status: "todo" as TaskStatus,
  priority: "medium" as TaskPriority,
  due_date: "",
  notes: "",
};

export default function WorkflowPage() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<ReleaseTask[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [labels, setLabels] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form, setForm] = useState(emptyForm);

  const hasAccess = user && canAccessWorkflow(user.role);
  const canManage = user && canManageWorkflow(user.role);
  const isArtist = user && isArtistRole(user.role);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const status of TASK_STATUSES) counts.set(status.value, 0);
    for (const task of tasks) {
      counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!statusFilter) return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  function resetForm(labelId?: string) {
    setForm({
      ...emptyForm,
      label: labelId ?? (labels.length === 1 ? String(labels[0].id) : ""),
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(task: ReleaseTask) {
    setEditingId(task.id);
    setForm({
      label: String(task.label),
      release: String(task.release),
      title: task.title,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? "",
      notes: task.notes ?? "",
    });
    setShowForm(true);
    setError(null);
  }

  useEffect(() => {
    if (!token || !hasAccess) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const taskData = await apiFetch<ReleaseTask[]>("/api/workflow/tasks/", {}, token!);
        setTasks(taskData);
        if (canManage) {
          const [releaseData, labelData] = await Promise.all([
            apiFetch<Release[]>("/api/catalog/releases/", {}, token!),
            apiFetch<{ id: number; name: string }[]>("/api/catalog/labels/", {}, token!),
          ]);
          setReleases(releaseData);
          setLabels(labelData);
          if (labelData.length === 1) {
            setForm((current) => ({ ...current, label: String(labelData[0].id) }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, hasAccess, canManage]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !canManage || !form.title.trim() || !form.label || !form.release) return;

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      label: Number(form.label),
      release: Number(form.release),
      title: form.title.trim(),
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      notes: form.notes.trim(),
    };

    try {
      const saved = editingId
        ? await apiFetch<ReleaseTask>(
            `/api/workflow/tasks/${editingId}/`,
            { method: "PATCH", body: JSON.stringify(payload) },
            token,
          )
        : await apiFetch<ReleaseTask>(
            "/api/workflow/tasks/",
            { method: "POST", body: JSON.stringify(payload) },
            token,
          );
      setTasks((current) =>
        editingId
          ? current.map((t) => (t.id === saved.id ? saved : t))
          : [saved, ...current],
      );
      resetForm(form.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save task.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasAccess) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        You do not have access to workflow tasks.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={isArtist ? "My tasks" : "Workflow"}
        description="Release project tasks — masters, artwork, marketing handoffs, and delivery checklists."
        action={
          canManage ? (
            <button
              type="button"
              onClick={() => {
                if (showForm) resetForm(form.label || undefined);
                else {
                  setEditingId(null);
                  setShowForm(true);
                }
              }}
              className="rounded-md bg-[var(--color-primary-fill)] px-4 py-2 text-sm font-semibold text-[var(--color-on-fill)]"
            >
              {showForm ? "Cancel" : "New task"}
            </button>
          ) : undefined
        }
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium border",
            !statusFilter
              ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
              : "border-[var(--color-border)] text-[var(--color-muted)]",
          ].join(" ")}
        >
          All ({tasks.length})
        </button>
        {TASK_STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => setStatusFilter(status.value)}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-medium border",
              statusFilter === status.value
                ? "border-[var(--color-primary-fill)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]",
            ].join(" ")}
          >
            {status.label} ({statusCounts.get(status.value) ?? 0})
          </button>
        ))}
      </div>

      {showForm && canManage ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
        >
          <h2 className="font-semibold">{editingId ? "Edit task" : "New task"}</h2>
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
              Release
              <select
                required
                value={form.release}
                onChange={(e) => setForm((c) => ({ ...c, release: e.target.value }))}
                className={inputClassName}
              >
                <option value="">Select release</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </label>
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
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((c) => ({ ...c, status: e.target.value as TaskStatus }))
                }
                className={inputClassName}
              >
                {TASK_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Priority
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((c) => ({ ...c, priority: e.target.value as TaskPriority }))
                }
                className={inputClassName}
              >
                {TASK_PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Due date
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((c) => ({ ...c, due_date: e.target.value }))}
                className={inputClassName}
              />
            </label>
          </div>
          <label className={labelClassName}>
            Notes
            <textarea
              rows={3}
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
            {submitting ? "Saving…" : editingId ? "Save changes" : "Add task"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => resetForm(form.label || undefined)}
              className="ml-2 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          ) : null}
        </form>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title={statusFilter ? "No tasks in this status" : "No tasks yet"}
          description={
            canManage
              ? "Track release work from masters delivery through store live dates."
              : "Tasks for your releases will appear here."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                {canManage ? <th className="px-4 py-3 font-medium text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{task.release_title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={task.status_display} status={task.status} />
                  </td>
                  <td className="px-4 py-3">{task.priority_display}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {formatDate(task.due_date)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {task.assigned_to_username || "—"}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        className="text-xs font-medium text-[var(--color-primary-text)] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
