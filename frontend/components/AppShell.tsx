"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { apiFetch } from "@/lib/api";
import {
  canAccessARPipeline,
  canAccessAnalytics,
  canAccessAuditLog,
  canAccessContracts,
  canAccessDAM,
  canAccessDistribution,
  canAccessERP,
  canAccessMarketing,
  canAccessPayments,
  canAccessPublishing,
  canAccessRoyalties,
  canAccessSplits,
  canAccessSync,
  canAccessWorkflow,
  canViewRoster,
  isArtistRole,
  useAuth,
} from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  artistLabel?: string;
  requiresFinance?: boolean;
  requiresSplits?: boolean;
  requiresPayments?: boolean;
  requiresActivity?: boolean;
  requiresRoster?: boolean;
  requiresContracts?: boolean;
  requiresPublishing?: boolean;
  requiresARPipeline?: boolean;
  requiresAnalytics?: boolean;
  requiresSync?: boolean;
  requiresMarketing?: boolean;
  requiresERP?: boolean;
  requiresWorkflow?: boolean;
  requiresDistribution?: boolean;
  requiresDAM?: boolean;
  requiresEarnings?: boolean;
  artistOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", artistLabel: "Home" },
  { href: "/catalog", label: "Catalog", artistLabel: "My releases" },
  { href: "/catalog/artists", label: "Artists", requiresRoster: true },
  { href: "/pipeline", label: "A&R Pipeline", requiresARPipeline: true },
  { href: "/workflow", label: "Workflow", artistLabel: "My tasks", requiresWorkflow: true },
  { href: "/distribution", label: "Distribution", artistLabel: "My deliveries", requiresDistribution: true },
  { href: "/assets", label: "Assets", artistLabel: "My assets", requiresDAM: true },
  { href: "/sync", label: "Sync", artistLabel: "My sync", requiresSync: true },
  { href: "/marketing", label: "Marketing", artistLabel: "My campaigns", requiresMarketing: true },
  { href: "/analytics", label: "Analytics", artistLabel: "My analytics", requiresAnalytics: true },
  { href: "/contracts", label: "Contracts", artistLabel: "My contracts", requiresContracts: true },
  { href: "/publishing", label: "Publishing", artistLabel: "My works", requiresPublishing: true },
  { href: "/earnings", label: "My earnings", requiresEarnings: true, artistOnly: true },
  { href: "/finance", label: "Finance", artistLabel: "My finances", requiresERP: true },
  { href: "/splits", label: "Splits", artistLabel: "My splits", requiresSplits: true },
  { href: "/royalties", label: "Royalties", requiresFinance: true },
  { href: "/payments", label: "Payments", artistLabel: "My payouts", requiresPayments: true },
  { href: "/notifications", label: "Notifications" },
  { href: "/activity", label: "Activity", requiresActivity: true },
  { href: "/export", label: "Export", artistLabel: "My data" },
  { href: "/settings/security", label: "Security" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<{ count: number }>(
        "/api/notifications/unread_count/",
        {},
        token,
      );
      setUnreadCount(data.count);
    } catch {
      // ignore badge fetch errors
    }
  }, [token]);

  useEffect(() => {
    refreshUnread();
    const id = window.setInterval(refreshUnread, 60_000);
    return () => window.clearInterval(id);
  }, [refreshUnread, pathname]);

  const links = NAV.filter((item) => {
    if (!user) return false;
    if (item.artistOnly && !isArtistRole(user.role)) return false;
    if (item.requiresEarnings && !isArtistRole(user.role)) return false;
    if (item.requiresRoster && !canViewRoster(user.role)) return false;
    if (item.requiresContracts && !canAccessContracts(user.role)) return false;
    if (item.requiresPublishing && !canAccessPublishing(user.role)) return false;
    if (item.requiresARPipeline && !canAccessARPipeline(user.role)) return false;
    if (item.requiresSync && !canAccessSync(user.role)) return false;
    if (item.requiresMarketing && !canAccessMarketing(user.role)) return false;
    if (item.requiresAnalytics && !canAccessAnalytics(user.role)) return false;
    if (item.requiresERP && !canAccessERP(user.role)) return false;
    if (item.requiresWorkflow && !canAccessWorkflow(user.role)) return false;
    if (item.requiresDistribution && !canAccessDistribution(user.role)) return false;
    if (item.requiresDAM && !canAccessDAM(user.role)) return false;
    if (item.requiresFinance && !canAccessRoyalties(user.role)) return false;
    if (item.requiresSplits && !canAccessSplits(user.role)) return false;
    if (item.requiresPayments && !canAccessPayments(user.role)) return false;
    if (item.requiresActivity && !canAccessAuditLog(user.role)) return false;
    return true;
  }).map((item) => ({
    ...item,
    label: isArtistRole(user!.role) && item.artistLabel ? item.artistLabel : item.label,
  }));

  return (
    <div className="min-h-full flex bg-[var(--color-bg)] text-[var(--color-ink)]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-5 py-6 border-b border-[var(--color-border)]">
          <Link href="/dashboard" className="block">
            <span className="font-semibold text-sm">Good Faith</span>
            <span className="block text-xs text-[var(--color-muted)] mt-0.5">
              Record Management
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const showBadge = item.href === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between gap-2",
                  active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]",
                ].join(" ")}
              >
                <span>{item.label}</span>
                {showBadge ? (
                  <span className="rounded-md bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[var(--color-border)] text-sm">
          <p className="font-medium truncate">{user?.username}</p>
          <p className="text-xs text-[var(--color-muted)] capitalize mt-0.5">
            {user?.role} role
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 text-xs font-medium text-[var(--color-primary-text)] hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <Link href="/dashboard" className="font-semibold text-sm">
            Good Faith
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="text-xs font-medium text-[var(--color-primary-text)]"
          >
            Sign out
          </button>
        </header>

        <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-muted)]"
            >
              {item.label}
              {item.href === "/notifications" && unreadCount > 0
                ? ` (${unreadCount > 99 ? "99+" : unreadCount})`
                : ""}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-8 sm:px-8 max-w-6xl w-full mx-auto">
          {user?.must_enable_2fa ? (
            <div
              className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              role="status"
            >
              <span>
                Enable two-factor authentication to access royalties, splits, and financial
                export.
              </span>
              <Link
                href="/settings/security"
                className="shrink-0 font-medium text-[var(--color-primary-text)] hover:underline"
              >
                Set up 2FA →
              </Link>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
