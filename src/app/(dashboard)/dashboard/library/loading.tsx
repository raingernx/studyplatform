export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-zinc-100" />
        <div className="mt-1.5 h-4 w-64 animate-pulse rounded bg-zinc-100" />
      </div>

      {/* Stats + continue row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[80, 88, 140].map((w) => (
            <div
              key={w}
              style={{ width: w }}
              className="h-8 animate-pulse rounded-full border border-zinc-200 bg-white"
            />
          ))}
        </div>
        <div className="h-10 w-52 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      </div>

      {/* Library grid placeholder */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl border border-zinc-100 bg-white shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
