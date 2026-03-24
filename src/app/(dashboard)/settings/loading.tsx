export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-100" />
        <div className="h-4 w-72 animate-pulse rounded bg-zinc-100" />
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card"
        >
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="mt-6 space-y-4">
            {Array.from({ length: index === 0 ? 2 : 3 }).map((__, row) => (
              <div
                key={row}
                className="h-11 animate-pulse rounded-xl border border-zinc-100 bg-zinc-50"
              />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="h-9 w-28 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
