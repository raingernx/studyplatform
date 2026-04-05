import { Navbar } from "@/components/layout/Navbar";
import { Container, colorScales } from "@/design-system";
import { HeroBannerFallback } from "@/components/marketplace/HeroBanner";
import {
  ResourcesCatalogControlsSkeleton,
  ResourcesCatalogSearchSkeleton,
} from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import { ResourcesDiscoverSectionsSkeleton } from "@/components/skeletons/ResourcesDiscoverSectionsSkeleton";

/**
 * Route-level skeleton for /resources.
 *
 * It mirrors the discover shell geometry because that is the primary public
 * entry to /resources and includes the hero/banner footprint that the live
 * page renders above the fold.
 */
export function ResourcesRouteSkeleton() {
  return (
    <div
      data-loading-scope="resources-browse"
      className="flex min-h-screen flex-col bg-background"
    >
      <Navbar
        headerSearch={<ResourcesCatalogSearchSkeleton />}
        secondaryRow={<ResourcesCatalogControlsSkeleton showDiscoverMeta />}
      />

      <main className="flex-1">
        <section
          className="relative overflow-hidden"
          style={{ backgroundColor: colorScales.brand[300] }}
        >
          <Container className="py-5 sm:py-6 lg:py-8">
            <HeroBannerFallback className="shadow-none" />
          </Container>
        </section>

        <Container className="space-y-16 pb-12 pt-5 sm:space-y-16 sm:pb-14 sm:pt-6 lg:space-y-20 lg:pb-16 lg:pt-8">
          <ResourcesDiscoverSectionsSkeleton />
        </Container>
      </main>
    </div>
  );
}
