import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";

/**
 * Full-page skeleton for /resources/[slug].
 *
 * Mirrors the two-column layout (gallery + content | purchase card) used by
 * the real detail page. Includes Navbar for the same reason as
 * ResourcesPageSkeleton — it is rendered inside the page component, not
 * the shared root layout.
 *
 * Grid columns, sticky sidebar, and order classes are copied verbatim from
 * the real page to prevent layout shift on hydration.
 */
export function ResourceDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-zinc-50">
        <Container className="py-10 sm:py-12 lg:py-14">
          <div className="space-y-6 lg:space-y-8">

            {/* ── Resource header ──────────────────────────────────────── */}
            <div className="space-y-3">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-10 animate-pulse rounded bg-surface-100" />
                <div className="h-3.5 w-2 animate-pulse rounded bg-surface-100" />
                <div className="h-3.5 w-20 animate-pulse rounded bg-surface-100" />
              </div>
              {/* Title — two lines */}
              <div className="h-8 w-3/4 animate-pulse rounded-lg bg-surface-100 sm:h-9" />
              <div className="h-8 w-1/2 animate-pulse rounded-lg bg-surface-100 sm:h-9" />
              {/* Meta row: creator · rating · sales · downloads */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-4 w-28 animate-pulse rounded bg-surface-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-surface-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
              </div>
            </div>

            {/* ── Two-column grid ───────────────────────────────────────── */}
            {/*
              Desktop: [gallery (col-1 row-1)] [purchase card (col-2 rows 1-2)]
                       [content  (col-1 row-2)]
              Mobile:  gallery → purchase card → content
            */}
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">

              {/* GALLERY — order-1 mobile, col-1 row-1 desktop */}
              <div className="order-1 lg:col-start-1 lg:row-start-1">
                <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-surface-100" />
              </div>

              {/* CONTENT — order-3 mobile, col-1 row-2 desktop */}
              <div className="order-3 space-y-6 lg:col-start-1 lg:row-start-2">
                {/* What's included bar */}
                <div className="h-12 animate-pulse rounded-2xl border border-surface-200 bg-white" />

                {/* Value panels: "What you'll achieve" + "Best for" */}
                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="h-48 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
                  <div className="h-48 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
                </div>

                {/* About / description */}
                <div className="space-y-3">
                  <div className="h-5 w-16 animate-pulse rounded bg-surface-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-surface-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-surface-100" />
                  </div>
                </div>

                {/* Reviews */}
                <div className="space-y-4">
                  <div className="h-5 w-20 animate-pulse rounded bg-surface-100" />
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-2xl border border-surface-200 bg-white"
                    />
                  ))}
                </div>
              </div>

              {/* PURCHASE CARD — order-2 mobile, col-2 rows 1-2 desktop */}
              <aside className="order-2 self-start lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
                <div className="h-[440px] animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card" />
              </aside>

            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
