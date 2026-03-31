import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { HeroBannerFallback } from "@/components/marketplace/HeroBanner";
import {
  ResourcesCatalogControlsSkeleton,
  ResourcesCatalogSearchSkeleton,
} from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function DiscoverDeferredSectionFallback({
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
          <LoadingSkeleton className={`h-6 ${titleWidth}`} />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton className="h-6 w-16" />
      </div>
      <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: cardCount }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

/**
 * Route-level skeleton for /resources.
 *
 * It mirrors the discover shell geometry because that is the primary public
 * entry to /resources and includes the hero/banner footprint that the live
 * page renders above the fold.
 */
export function ResourcesRouteSkeleton() {
  const discoverHeroClassName =
    "min-h-[440px] rounded-[26px] border-white/70 sm:min-h-[500px] lg:min-h-[540px]";

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar
        headerSearch={<ResourcesCatalogSearchSkeleton />}
        secondaryRow={<ResourcesCatalogControlsSkeleton showDiscoverMeta />}
      />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(224,231,255,0.78),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <Container className="py-4 sm:py-6 lg:py-7">
            <HeroBannerFallback className={discoverHeroClassName} />
          </Container>
        </section>

        <Container className="space-y-16 pb-12 pt-5 sm:space-y-16 sm:pb-14 sm:pt-6 lg:space-y-20 lg:pb-16 lg:pt-8">
          <DiscoverDeferredSectionFallback titleWidth="w-44" cardCount={4} />
          <DiscoverDeferredSectionFallback titleWidth="w-52" cardCount={5} />
        </Container>
      </main>
    </div>
  );
}
