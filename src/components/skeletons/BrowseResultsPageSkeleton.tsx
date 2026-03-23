import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { RESOURCE_GRID_CLASSES } from "@/components/resources/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";

/**
 * Route-level skeleton for /resources in browse/filter mode
 * (i.e. when any of ?category, ?search, ?price, ?sort, ?tag are present).
 *
 * Mirrors the two-section layout: category nav card → results card with
 * sticky sidebar + paginated grid. Exact widths and grid classes are copied
 * from the live page to prevent layout shift on hydration.
 *
 * Used by resources/loading.tsx which fires on all client-side navigations
 * to /resources. Browse mode is the more common navigation target
 * (category chips, links, search), so this skeleton is shown instead of
 * the discover-mode ResourcesPageSkeleton.
 */
export function BrowseResultsPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">

          {/* ── Category nav + search card ──────────────────────────────── */}
          <section className="rounded-[32px] border border-surface-200 bg-white/90 p-4 shadow-card sm:p-5 lg:p-6">
            <div className="space-y-5">

              {/* Title row */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-surface-100" />
                  <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-100 sm:h-9" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full border border-surface-200 bg-surface-50" />
                  <div className="h-6 w-28 animate-pulse rounded-full border border-surface-200 bg-surface-50" />
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-surface-200 via-surface-100 to-transparent" aria-hidden />

              {/* Chips + search row */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                  {/* Discover button */}
                  <div className="h-9 w-24 flex-shrink-0 animate-pulse rounded-lg bg-surface-100" />
                  <div className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />
                  {/* Category chips */}
                  <div className="flex gap-2 overflow-hidden">
                    {[48, 72, 64, 56, 80, 60].map((w, i) => (
                      <div
                        key={i}
                        style={{ width: w }}
                        className="h-8 shrink-0 animate-pulse rounded-full bg-surface-100"
                      />
                    ))}
                  </div>
                </div>
                {/* Search bar */}
                <div className="h-11 w-full animate-pulse rounded-2xl border border-surface-200 bg-white shadow-sm lg:max-w-lg" />
              </div>

            </div>
          </section>

          {/* ── Results card ─────────────────────────────────────────────── */}
          <section className="rounded-[32px] border border-surface-200 bg-white/85 p-4 shadow-card sm:p-5 lg:p-6">
            <div className="space-y-6">

              {/* Results header */}
              <div className="flex flex-col gap-2 border-b border-surface-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <div className="h-3 w-16 animate-pulse rounded bg-surface-100" />
                  <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100 sm:h-8" />
                  <div className="h-4 w-72 animate-pulse rounded bg-surface-100" />
                </div>
                <div className="h-4 w-24 animate-pulse rounded bg-surface-100" />
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

                {/* ── Sidebar (desktop only) ─────────────────────────────── */}
                <div className="hidden lg:block">
                  <aside className="w-[280px] flex-shrink-0 space-y-4">
                    {/* "Filters" header row */}
                    <div className="h-10 animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card" />
                    {/* Sort group */}
                    <div className="animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card p-4">
                      <div className="mb-3 h-3 w-12 rounded bg-surface-100" />
                      <div className="space-y-1.5">
                        {[64, 56, 72, 60, 80].map((w, i) => (
                          <div key={i} style={{ width: w }} className="h-8 rounded-lg bg-surface-100" />
                        ))}
                      </div>
                    </div>
                    {/* Category group */}
                    <div className="animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card p-4">
                      <div className="mb-3 h-3 w-16 rounded bg-surface-100" />
                      <div className="space-y-1.5">
                        {[80, 64, 72, 56].map((w, i) => (
                          <div key={i} style={{ width: w }} className="h-8 rounded-lg bg-surface-100" />
                        ))}
                      </div>
                    </div>
                    {/* Price group */}
                    <div className="animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card p-4">
                      <div className="mb-3 h-3 w-10 rounded bg-surface-100" />
                      <div className="space-y-1.5">
                        {[64, 56, 60].map((w, i) => (
                          <div key={i} style={{ width: w }} className="h-8 rounded-lg bg-surface-100" />
                        ))}
                      </div>
                    </div>
                    {/* Difficulty chips group */}
                    <div className="animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card p-4">
                      <div className="mb-3 h-3 w-16 rounded bg-surface-100" />
                      <div className="flex flex-wrap gap-2">
                        {[64, 80, 64].map((w, i) => (
                          <div key={i} style={{ width: w }} className="h-7 rounded-full bg-surface-100" />
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>

                {/* ── Results area ───────────────────────────────────────── */}
                <div className="min-w-0 flex-1 space-y-5">
                  {/* FilterBar */}
                  <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="h-4 w-24 animate-pulse rounded bg-surface-100" />
                      <div className="flex gap-2">
                        <div className="h-10 w-28 animate-pulse rounded-lg bg-surface-100" />
                        <div className="h-10 w-32 animate-pulse rounded-lg bg-surface-100" />
                      </div>
                    </div>
                  </div>

                  {/* Resource grid */}
                  <div className={RESOURCE_GRID_CLASSES}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <ResourceCardSkeleton key={i} />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>

        </Container>
      </main>
    </div>
  );
}
