export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-14 animate-pulse rounded bg-zinc-100" />
          <div className="h-9 w-52 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-4 w-96 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-40 animate-pulse rounded-lg border border-zinc-200 bg-white" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-zinc-200" />
        </div>
      </div>

      {/* Primary stats — 3 cols */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="h-9 w-32 animate-pulse rounded-lg bg-zinc-100" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>

      {/* Secondary stats — 3 cols */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card"
          >
            <div className="mb-2 h-3 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-8 w-12 animate-pulse rounded-lg bg-zinc-100" />
            <div className="mt-1 h-4 w-36 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>

      {/* Performance table section */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div className="space-y-1">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-64 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="px-6 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-zinc-50 py-4 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
              <div className="ml-auto flex gap-8">
                {[40, 40, 48, 48, 56].map((w, j) => (
                  <div
                    key={j}
                    style={{ width: w }}
                    className="h-4 animate-pulse rounded bg-zinc-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
