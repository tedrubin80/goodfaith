import type { StatementStatus } from "@/lib/types";

const STYLES: Record<StatementStatus, string> = {
  pending: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  processing: "bg-blue-500/10 text-blue-800 dark:text-blue-200",
  processed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  failed: "bg-red-500/10 text-red-800 dark:text-red-200",
};

export function StatusBadge({
  label,
  status,
}: {
  label: string;
  status?: StatementStatus;
}) {
  const style = status ? STYLES[status] : "bg-[var(--color-surface-2)] text-[var(--color-muted)]";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
