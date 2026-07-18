import { titleCase } from "@/lib/format";
import type { StatementStatus } from "@/lib/types";

type BadgeStatus =
  | StatementStatus
  | "ready"
  | "partially_paid"
  | "paid"
  | "closed"
  | "pending"
  | "cancelled"
  | "draft"
  | "finalized"
  | "active"
  | "expired"
  | "terminated"
  | "ready"
  | "submitted"
  | "registered"
  | "lead"
  | "researching"
  | "contacting"
  | "meeting"
  | "negotiating"
  | "signed"
  | "passed"
  | "on_hold"
  | "inquiry"
  | "pitched"
  | "shortlisted"
  | "cleared"
  | "licensed";

const STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  processing: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  processed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  failed: "bg-red-500/10 text-red-800 dark:text-red-200",
  ready: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  partially_paid: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  paid: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  closed: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  cancelled: "bg-red-500/10 text-red-800 dark:text-red-200",
  draft: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  active: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  expired: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  terminated: "bg-red-500/10 text-red-800 dark:text-red-200",
  finalized: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  submitted: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  registered: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  lead: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  researching: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  contacting: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  meeting: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  negotiating: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  signed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  passed: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  on_hold: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  inquiry: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  pitched: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  shortlisted: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  cleared: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  licensed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
};

export function StatusBadge({
  label,
  status,
}: {
  label?: string;
  status?: BadgeStatus;
}) {
  const style = status ? STYLES[status] : "bg-[var(--color-surface-2)] text-[var(--color-muted)]";
  const text = label ?? (status ? titleCase(status) : "—");

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style,
      ].join(" ")}
    >
      {text}
    </span>
  );
}
