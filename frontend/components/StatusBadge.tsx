import { titleCase } from "@/lib/format";
import type { StatementStatus } from "@/lib/types";

type BadgeStatus = StatementStatus | "ready" | "partially_paid" | "paid" | "closed" | "pending" | "cancelled" | "draft" | "finalized";

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
  finalized: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
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
