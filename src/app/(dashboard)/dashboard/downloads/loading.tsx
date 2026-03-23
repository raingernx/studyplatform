export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-8 w-44 animate-pulse rounded-lg bg-zinc-100" />
          <div className="mt-1.5 h-4 w-80 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-full border border-zinc-200 bg-white" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_140px_100px_100px] gap-4 border-b border-zinc-100 bg-zinc-50/60 px-6 py-3">
          {[120, 80, 96, 60, 72].map((w, i) => (
            <div
              key={i}
              style={{ width: w }}
              className="h-3 animate-pulse rounded bg-zinc-200"
            />
          ))}
        </div>

        {/* Rows */}
        <ul className="divide-y divide-zinc-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <div className="grid grid-cols-[2fr_1fr_140px_100px_100px] items-center gap-4 px-6 py-4">
                {/* Resource */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-xl bg-zinc-100" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-10 animate-pulse rounded-full bg-zinc-100" />
                  </div>
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
                <div className="h-7 w-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
