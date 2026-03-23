import { Navbar } from "@/components/layout/Navbar";
import { PageContainer, PageContentWide } from "@/design-system";
import { RESOURCE_GRID_CLASSES } from "@/components/resources/ResourceGrid";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";

/**
 * Full-page skeleton for /creators/[slug].
 *
 * Mirrors the profile card (banner + avatar + name + bio), 3-col stats grid,
 * and published resources grid used by the real page.
 * Includes Navbar — public route, same as CategoryPageSkeleton pattern.
 */
export function CreatorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main>
        <PageContainer className="py-10">
          <PageContentWide>

            {/* ── Profile card ──────────────────────────────────────────── */}
            <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-card">
              {/* Banner */}
              <div className="h-48 animate-pulse bg-gradient-to-r from-slate-200 to-slate-300" />

              <div className="px-6 pb-8">
                {/* Avatar + name row */}
                <div className="-mt-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex items-end gap-4">
                    {/* Avatar */}
                    <div className="h-24 w-24 animate-pulse rounded-[28px] border-4 border-white bg-zinc-200" />
                    <div className="space-y-2 pb-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-44 animate-pulse rounded-lg bg-zinc-100" />
                        <div className="h-6 w-28 animate-pulse rounded-full bg-zinc-100" />
                      </div>
                      <div className="h-3.5 w-32 animate-pulse rounded bg-zinc-100" />
                      <div className="h-3.5 w-24 animate-pulse rounded bg-zinc-100" />
                    </div>
                  </div>
                  {/* Social links */}
                  <div className="flex flex-wrap gap-2">
                    {[80, 96, 80].map((w, i) => (
                      <div
                        key={i}
                        style={{ width: w }}
                        className="h-9 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50"
                      />
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-6 space-y-2">
                  <div className="h-4 w-full max-w-xl animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-3/4 max-w-lg animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
            </section>

            {/* ── Stats grid ────────────────────────────────────────────── */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
                  </div>
                  <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-zinc-100" />
                </div>
              ))}
            </div>

            {/* ── Published resources ───────────────────────────────────── */}
            <section className="mt-8 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-7 w-44 animate-pulse rounded-lg bg-zinc-100" />
                  <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
                </div>
              </div>

              <div className={`mt-6 ${RESOURCE_GRID_CLASSES}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ResourceCardSkeleton key={i} />
                ))}
              </div>
            </section>

          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}
