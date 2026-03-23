import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";

/**
 * Neutral route-level skeleton for /resources — used by the loading.tsx that
 * fires on ALL client-side navigations to this route, regardless of mode.
 *
 * The problem: loading.tsx receives no search params, so it cannot know
 * whether the page will render in discover mode (no category/search) or
 * browse mode (?category=X / ?search=X). Rendering either mode's full
 * skeleton causes a layout shift when the other mode loads.
 *
 * The solution: render only the section that is structurally identical in
 * both modes — the category nav + search card — then show a flat card grid
 * below. Both modes ultimately render resource cards; the transition from a
 * flat grid to either discover sections or a sidebar grid is minimal.
 *
 * What is deliberately excluded:
 * - Hero banner + announcement bar (discover-only)
 * - Sidebar filter panel (browse-only)
 * - FilterBar toolbar (browse-only)
 * - Named section headers / "Browse by category" grid (discover-only)
 *
 * ResourcesPageSkeleton  — kept for discover-mode storybook / preview use
 * BrowseResultsPageSkeleton — kept for browse-mode storybook / preview use
 */
export function ResourcesRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">

          {/* ── Category nav + search card (shared between both modes) ─── */}
          <section className="rounded-[32px] border border-surface-200 bg-white/90 p-4 shadow-card sm:p-5 lg:p-6">
            <div className="space-y-5">
              {/* Label + title + meta badges */}
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

              {/* Discover button + category chips + search bar */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden sm:gap-4">
                  <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-surface-100" />
                  <div className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />
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
                <div className="h-11 w-full shrink-0 animate-pulse rounded-2xl border border-surface-200 bg-white shadow-sm lg:max-w-lg" />
              </div>
            </div>
          </section>

          {/* ── Neutral card grid — valid placeholder for both modes ──── */}
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>

        </Container>
      </main>
    </div>
  );
}
