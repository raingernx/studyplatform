import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { HeroBannerSkeleton } from "@/components/marketplace/HeroBanner";
import { ResourcesCatalogControlsSkeleton } from "@/components/marketplace/ResourcesCatalogControls";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

/**
 * Route-level skeleton for /resources.
 *
 * It mirrors the discover shell geometry because that is the primary public
 * entry to /resources and includes the hero/banner footprint that the live
 * page renders above the fold.
 */
export function ResourcesRouteSkeleton() {
  const discoverHeroClassName =
    "min-h-[440px] rounded-[26px] border-white/70 bg-surface-100 sm:min-h-[500px] lg:min-h-[540px]";

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar secondaryRow={<ResourcesCatalogControlsSkeleton showDiscoverMeta />} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(224,231,255,0.78),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <Container className="space-y-4 py-4 sm:space-y-5 sm:py-6 lg:space-y-6 lg:py-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <LoadingSkeleton className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <LoadingSkeleton className="h-4 w-48" />
              <span className="hidden text-text-muted sm:inline">•</span>
              <LoadingSkeleton className="hidden h-4 w-72 sm:block" />
            </div>
            <HeroBannerSkeleton className={discoverHeroClassName} />
          </Container>
        </section>

        <Container className="space-y-10 pb-12 pt-5 sm:space-y-12 sm:pb-14 sm:pt-6 lg:space-y-14 lg:pb-16 lg:pt-8">
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
