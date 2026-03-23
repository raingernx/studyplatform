import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";

/**
 * Full-page skeleton for the /resources marketplace page.
 *
 * Mirrors the discover-mode layout (no category selected) — the default
 * entry state for the homepage. Includes the real Navbar because each
 * public page renders its own Navbar inside the page component, not in
 * the shared root layout.
 *
 * Dimensions, grid classes, and max-widths match the real page exactly
 * to avoid layout shift when the real content replaces this skeleton.
 */
export function ResourcesPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        {/* ── Announcement bar + Hero banner ───────────────────────────── */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="mx-auto max-w-[1600px] space-y-4">
            {/* Announcement bar */}
            <div className="h-10 animate-pulse rounded-2xl border border-surface-200 bg-white" />
            {/* Hero banner */}
            <div className="h-[180px] animate-pulse rounded-3xl bg-surface-100 sm:h-[220px]" />
          </div>
        </section>

        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">
          {/* ── Category nav card ──────────────────────────────────────── */}
          <section className="rounded-[32px] border border-surface-200 bg-white/90 p-4 shadow-card sm:p-5 lg:p-6">
            <div className="space-y-5">
              {/* Label + title + description */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-2.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-surface-100" />
                  <div className="h-7 w-3/4 animate-pulse rounded-lg bg-surface-100 sm:h-8" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-surface-100" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-24 animate-pulse rounded-full border border-surface-200 bg-surface-50" />
                  <div className="h-6 w-24 animate-pulse rounded-full border border-surface-200 bg-surface-50" />
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-surface-200 via-surface-100 to-transparent" aria-hidden />

              {/* Discover button + category chips + search */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden sm:gap-4">
                  {/* Discover button */}
                  <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-surface-100" />
                  <div className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />
                  {/* Category chips */}
                  <div className="flex gap-2 overflow-hidden">
                    {[48, 64, 72, 56, 80, 60].map((w, i) => (
                      <div
                        key={i}
                        className="h-8 shrink-0 animate-pulse rounded-full bg-surface-100"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                </div>
                {/* Search bar */}
                <div className="h-11 w-full shrink-0 animate-pulse rounded-2xl border border-surface-200 bg-white shadow-sm lg:max-w-lg" />
              </div>
            </div>
          </section>

          {/* ── Browse by category ─────────────────────────────────────── */}
          <section className="space-y-6">
            <div className="space-y-1.5">
              <div className="h-6 w-40 animate-pulse rounded bg-surface-100" />
              <div className="h-4 w-80 animate-pulse rounded bg-surface-100" />
            </div>
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-[24px] border border-surface-200 bg-white shadow-card"
                />
              ))}
            </div>
          </section>

          {/* ── Trending now ───────────────────────────────────────────── */}
          <SectionSkeleton titleWidth="w-32" cardCount={4} />

          {/* ── Recommended / secondary section ────────────────────────── */}
          <SectionSkeleton titleWidth="w-48" cardCount={4} />
        </Container>
      </main>
    </div>
  );
}

/** Reusable section skeleton: header + card grid. */
function SectionSkeleton({
  titleWidth,
  cardCount,
}: {
  titleWidth: string;
  cardCount: number;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-surface-200/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className={`h-6 animate-pulse rounded bg-surface-100 ${titleWidth}`} />
          <div className="h-4 w-64 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded bg-surface-100" />
      </div>
      <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: cardCount }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
