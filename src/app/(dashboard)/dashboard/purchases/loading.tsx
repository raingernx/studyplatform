export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-100" />
          <div className="mt-1.5 h-4 w-60 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
          <div className="h-6 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_120px_120px_100px] gap-4 border-b border-zinc-100 bg-zinc-50/60 px-6 py-3">
          {[120, 80, 80, 72, 60].map((w, i) => (
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
              <div className="grid grid-cols-[2fr_1fr_120px_120px_100px] items-center gap-4 px-6 py-4">
                {/* Resource */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-xl bg-zinc-100" />
                  <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-100" />
              </div>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-6 py-3">
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
