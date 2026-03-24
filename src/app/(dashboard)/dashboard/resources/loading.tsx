export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-100" />
        <div className="h-4 w-72 animate-pulse rounded bg-zinc-100" />
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-100" />
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-56 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-zinc-100 bg-zinc-50/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
