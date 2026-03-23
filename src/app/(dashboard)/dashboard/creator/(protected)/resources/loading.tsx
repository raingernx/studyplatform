export default function Loading() {
  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-surface-200 pb-4">
        <div className="space-y-1.5">
          <div className="h-3 w-14 animate-pulse rounded bg-zinc-100" />
          <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-4 w-80 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200" />
      </div>

      {/* Stats — 3 cols */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-zinc-100" />
            <div className="mt-1 h-3.5 w-28 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-100" />
            <div className="h-9 w-32 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />
          </div>
        ))}
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-16 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-9 w-16 animate-pulse rounded-lg border border-zinc-200 bg-white" />
        </div>
      </div>

      {/* Table */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80">
              <tr>
                {[140, 80, 56, 72, 72, 60, 80].map((w, i) => (
                  <th key={i} className="px-3 py-3">
                    <div
                      style={{ width: w }}
                      className="h-3 animate-pulse rounded bg-zinc-200"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="bg-white">
                  <td className="px-2 py-3">
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
                      <div className="h-3 w-28 animate-pulse rounded bg-zinc-100" />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="ml-auto h-4 w-14 animate-pulse rounded bg-zinc-100" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="ml-auto h-4 w-10 animate-pulse rounded bg-zinc-100" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="ml-auto h-4 w-14 animate-pulse rounded bg-zinc-100" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-100" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="ml-auto h-7 w-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
