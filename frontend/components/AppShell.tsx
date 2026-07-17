"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { canAccessPayments, canAccessRoyalties, canAccessSplits, useAuth } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  requiresFinance?: boolean;
  requiresSplits?: boolean;
  requiresPayments?: boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/catalog", label: "Catalog" },
  { href: "/catalog/artists", label: "Artists" },
  { href: "/splits", label: "Splits", requiresSplits: true },
  { href: "/royalties", label: "Royalties", requiresFinance: true },
  { href: "/payments", label: "Payments", requiresPayments: true },
  { href: "/export", label: "Export" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = NAV.filter((item) => {
    if (!user) return false;
    if (item.requiresFinance && !canAccessRoyalties(user.role)) return false;
    if (item.requiresSplits && !canAccessSplits(user.role)) return false;
    if (item.requiresPayments && !canAccessPayments(user.role)) return false;
    return true;
  });

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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]",
                ].join(" ")}
              >
                {item.label}
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
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-8 sm:px-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
