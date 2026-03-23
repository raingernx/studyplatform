/**
 * Dashboard page loading skeleton.
 *
 * Rendered inside DashboardShell (provided by the group layout) — no Navbar
 * is needed here. Matches the real page's top-level `space-y-8` wrapper and
 * the four sections that are always visible on first render:
 *   1. Welcome header
 *   2. Stats grid (2 cols mobile / 4 cols desktop)
 *   3. Two-column content area (recent + actions)
 *   4. Horizontal resource row
 */
export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] animate-pulse rounded-2xl border border-neutral-100 bg-white shadow-card"
          />
        ))}
      </div>

      {/* Two-column content area */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-64 animate-pulse rounded-2xl border border-neutral-100 bg-white shadow-card" />
        <div className="h-64 animate-pulse rounded-2xl border border-neutral-100 bg-white shadow-card" />
      </div>

      {/* Horizontal resource row */}
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-neutral-100 bg-white shadow-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
