import Link from "next/link";

const PORTALS = [
  {
    role: "Artist",
    description: "Your royalties, your releases.",
    href: "/login",
  },
  {
    role: "Manager",
    description: "All artists, budgets, release calendar.",
    href: "/login",
  },
  {
    role: "Finance",
    description: "All financial data, statements, contracts.",
    href: "/login",
  },
  {
    role: "A&R",
    description: "Artist pipeline, signing status.",
    href: "/login",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-[var(--color-bg)]">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-10 py-24 px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Good Faith Record Management
          </h1>
          <p className="mt-2 max-w-md text-[var(--color-muted)]">
            Flat-fee, distributor-agnostic label management. No percentage of
            earnings, ever.
          </p>
          <Link
            href="/login"
            className="inline-flex mt-6 items-center rounded-md bg-[var(--color-primary-fill)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-fill)] hover:opacity-90 transition-opacity"
          >
            Sign in to the portal
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PORTALS.map((portal) => (
            <Link
              key={portal.role}
              href={portal.href}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary-fill)] transition-colors"
            >
              <h2 className="font-medium">{portal.role}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {portal.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
