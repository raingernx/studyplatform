import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { RESOURCE_GRID_CLASSES } from "@/components/resources/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCard";

/**
 * Full-page skeleton for /categories/[slug].
 *
 * Uses a neutral slate gradient for the hero because the slug-specific colour
 * is unknown at load time. Mirrors the rounded card + grid layout of the real
 * page so there is no layout shift on hydration.
 */
export function CategoryPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      {/* Hero banner — neutral gradient (slug colour unknown) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>
        <Container className="relative space-y-6 pb-12 pt-10 lg:pb-14 lg:pt-12">
          {/* Back link */}
          <div className="mb-5 h-4 w-24 animate-pulse rounded bg-white/20" />

          {/* Emoji + title + description */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-white/20" />
            <div className="space-y-2">
              <div className="h-9 w-48 animate-pulse rounded-lg bg-white/20 sm:h-10" />
              <div className="h-4 w-72 animate-pulse rounded bg-white/15" />
              <div className="h-4 w-56 animate-pulse rounded bg-white/15" />
            </div>
          </div>

          {/* Count badge */}
          <div className="h-7 w-28 animate-pulse rounded-full bg-white/20" />
        </Container>
      </div>

      {/* Resources card */}
      <main className="flex-1">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-surface-200 bg-white/85 p-4 shadow-card sm:p-5 lg:p-6">
              {/* Section header */}
              <div className="mb-6 flex flex-col gap-3 border-b border-surface-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded bg-surface-100" />
                  <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
                  <div className="h-4 w-80 animate-pulse rounded bg-surface-100" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-surface-100" />
              </div>

              {/* Resource grid */}
              <div className={RESOURCE_GRID_CLASSES}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ResourceCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
