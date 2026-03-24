export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-zinc-100" />
        <div className="h-4 w-80 animate-pulse rounded bg-zinc-100" />
      </div>

      <div className="h-56 animate-pulse rounded-2xl bg-gradient-to-br from-violet-200 via-blue-200 to-blue-100" />

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-zinc-100 bg-white shadow-card"
          />
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card">
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="h-8 w-8 animate-pulse rounded-xl bg-zinc-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
                <div className="h-3 w-72 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
