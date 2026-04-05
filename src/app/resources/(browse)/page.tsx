import { Suspense, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Container, colorScales } from "@/design-system";
import { DEFAULT_SORT, getEffectiveMarketplaceSort } from "@/config/sortOptions";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { ResourcesContentFallback } from "@/components/skeletons/ResourcesContentFallback";
import {
  ResourcesDiscoverHero,
  ResourcesPageContent,
} from "../ResourcesPageContent";
import { HeroBannerFallback } from "@/components/marketplace/HeroBanner";
import { ResourcesCatalogControls } from "@/components/marketplace/ResourcesCatalogControls";
import {
  ResourcesCatalogSearchSkeleton,
  ResourcesCatalogControlsSkeleton,
} from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import {
  trackRequestWork,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

export const metadata = {
  title: "Discover Study Resources",
  description: "Browse and download study resources.",
};

type SearchParamValue = string | string[] | undefined;

interface ResourcesPageProps {
  searchParams?: Promise<Record<string, SearchParamValue>>;
}

function getSearchParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

async function AwaitResolvedNode({
  promise,
}: {
  promise: Promise<ReactNode>;
}) {
  return <>{await promise}</>;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  const {
    search: rawSearch,
    category: rawCategory,
    price: rawPrice,
    featured: rawFeatured,
    tag: rawTag,
    sort: rawSort,
    page: rawPage,
  } = resolvedParams;

  const search = getSearchParamValue(rawSearch)?.trim();
  const category = getSearchParamValue(rawCategory)?.trim();
  const rawPriceValue = getSearchParamValue(rawPrice)?.trim() ?? "";
  const price = rawPriceValue === "free" || rawPriceValue === "paid" ? rawPriceValue : "";
  const featured = getSearchParamValue(rawFeatured)?.trim();
  const tag = getSearchParamValue(rawTag)?.trim();
  const hasSearch = Boolean(search);
  const sort = getEffectiveMarketplaceSort(getSearchParamValue(rawSort), hasSearch);
  const pageParam = getSearchParamValue(rawPage)?.trim();
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const hasListingIntent = Boolean(
    search ||
    category ||
    price ||
    tag ||
    featured === "true" ||
    currentPage > 1 ||
    sort !== DEFAULT_SORT,
  );
  const isDiscoverMode = !hasListingIntent;
  const mobileFilterActiveCount = isDiscoverMode
    ? 0
    : [Boolean(category && category !== "all"), Boolean(tag)].filter(Boolean).length;

  return withRequestPerformanceTrace(
    "route:/resources",
    {
      category: category ?? null,
      currentPage,
      mode: isDiscoverMode ? "discover" : "listing",
      sort,
    },
    async () => {
      const heroPromise = isDiscoverMode
        ? trackRequestWork(
            ResourcesDiscoverHero({
              className: "shadow-none",
            }),
          )
        : null;
      const contentPromise = trackRequestWork(
        ResourcesPageContent({
          isDiscoverMode,
          search,
          category,
          price,
          featured,
          tag,
          sort,
          effectiveSort: sort,
          currentPage,
        }),
      );

      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar
            headerSearch={
              <Suspense fallback={<ResourcesCatalogSearchSkeleton />}>
                <HeroSearch variant="listing" />
              </Suspense>
            }
            secondaryRow={
              <Suspense fallback={<ResourcesCatalogControlsSkeleton showDiscoverMeta={isDiscoverMode} />}>
                <ResourcesCatalogControls
                  activeCount={mobileFilterActiveCount}
                  showDiscoverMeta={isDiscoverMode}
                />
              </Suspense>
            }
          />

          <main className="flex-1">
            {isDiscoverMode ? (
              <section
                className="relative overflow-hidden"
                style={{ backgroundColor: colorScales.brand[300] }}
              >
                <Container className="space-y-4 py-5 sm:space-y-5 sm:py-6 lg:space-y-6 lg:py-8">
                  {heroPromise ? (
                    <Suspense fallback={<HeroBannerFallback className="shadow-none" />}>
                      <AwaitResolvedNode promise={heroPromise} />
                    </Suspense>
                  ) : null}
                </Container>
              </section>
            ) : null}

            <Container
              className={
                isDiscoverMode
                  ? "space-y-10 pb-12 pt-5 sm:space-y-12 sm:pb-14 sm:pt-6 lg:space-y-14 lg:pb-16 lg:pt-8"
                  : "space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16"
              }
            >
              <Suspense fallback={<ResourcesContentFallback isDiscoverMode={isDiscoverMode} />}>
                <AwaitResolvedNode promise={contentPromise} />
              </Suspense>
            </Container>
          </main>
        </div>
      );
    },
  );
}
