const PORTALS = [
  { role: "Artist", description: "Your royalties, your releases." },
  { role: "Manager", description: "All artists, budgets, release calendar." },
  { role: "Finance", description: "All financial data, statements, contracts." },
  { role: "A&R", description: "Artist pipeline, signing status." },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-10 py-24 px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Good Faith Record Management
          </h1>
          <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
            Flat-fee, distributor-agnostic label management. No percentage of
            earnings, ever.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PORTALS.map((portal) => (
            <div
              key={portal.role}
              className="rounded-lg border border-black/[.08] p-5 dark:border-white/[.145]"
            >
              <h2 className="font-medium text-black dark:text-zinc-50">
                {portal.role}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {portal.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
