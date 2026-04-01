import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { isMissingTableError } from "@/lib/prismaErrors";
import { ResourcesDiscoverPersonalizedSection } from "@/components/resources/ResourcesDiscoverPersonalizedSection";
import { ResourcesViewerStateProvider } from "@/components/resources/ResourcesViewerStateProvider";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { ViewerAwareResourceCard } from "@/components/resources/ViewerAwareResourceCard";
import { ViewerAwareResourceGrid } from "@/components/resources/ViewerAwareResourceGrid";
import { SearchRecoveryPanel } from "@/components/resources/SearchRecoveryPanel";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { HeroBanner } from "@/components/marketplace/HeroBanner";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { FilterSidebar, type FilterCategory } from "@/components/marketplace/FilterSidebar";
import { CreatorCTA } from "@/components/discover/CreatorCTA";
import { BlogSection } from "@/components/discover/BlogSection";
import { EmailSignup } from "@/components/discover/EmailSignup";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatNumber, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getDiscoverData,
  getHeroConfig,
  type DiscoverData,
} from "@/services/discover.service";
import { getSearchRecoveryData } from "@/services/search-recovery.service";
import {
  DEFAULT_SORT,
  getMarketplaceSortOptions,
  SEARCH_SORT_OPTION,
} from "@/config/sortOptions";
import { MARKETPLACE_LISTING_PAGE_SIZE } from "@/config/marketplace";
import { getMarketplaceResources } from "@/services/resources/public-resource-read.service";
import { ResourcesIntroSectionSkeleton } from "@/components/skeletons/ResourcesIntroSectionSkeleton";
import {
  trackRequestWork,
  traceServerStep,
} from "@/lib/performance/observability";

const BLOG_SECTION_ENABLED = false;

type ResourcesPageContentProps = {
  isDiscoverMode: boolean;
  search?: string;
  category?: string;
  price: string;
  featured?: string;
  tag?: string;
  sort: string;
  effectiveSort: string;
  currentPage: number;
};

export async function ResourcesDiscoverHero({
  className,
}: {
  className?: string;
}) {
  let heroConfig: Awaited<ReturnType<typeof getHeroConfig>> = null;

  try {
    heroConfig = await traceServerStep(
      "resources.getHeroConfig",
      () => getHeroConfig({ staticAnonSeed: true }),
      { personalized: false },
    );
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  return <HeroBanner config={heroConfig} className={className} />;
}

export async function ResourcesPageContent({
  isDiscoverMode,
  search,
  category,
  price,
  featured,
  tag,
  sort,
  effectiveSort,
  currentPage,
}: ResourcesPageContentProps) {
  return (
    <ResourcesViewerStateProvider>
      {isDiscoverMode
        ? <ResourcesDiscoverContent />
        : await ResourcesListingContent({
            search,
            category,
            price,
            featured,
            tag,
            sort,
            effectiveSort,
            currentPage,
          })}
    </ResourcesViewerStateProvider>
  );
}

async function ResourcesListingContent({
  search,
  category,
  price,
  featured,
  tag,
  sort,
  effectiveSort,
  currentPage,
}: Omit<ResourcesPageContentProps, "isDiscoverMode">) {
  const normalizedSearch = search?.trim() ?? "";
  let categories: { id: string; name: string; slug: string }[] = [];
  let resources: ResourceCardData[] = [];
  let total = 0;
  let totalPages = 1;
  let safePage = 1;
  let searchRecovery = null as Awaited<ReturnType<typeof getSearchRecoveryData>> | null;

  try {
    const data = await traceServerStep(
      "resources.getMarketplaceResources",
      () =>
        getMarketplaceResources({
          search,
          category,
          price,
          featured: featured === "true",
          tag,
          sort: effectiveSort,
          page: currentPage,
          pageSize: MARKETPLACE_LISTING_PAGE_SIZE,
        }),
      {
        category: category ?? "all",
        page: currentPage,
        sort: effectiveSort,
      },
    );
    resources = data.resources as ResourceCardData[];
    total = data.total;
    categories = data.categories;
    totalPages = data.totalPages;
    safePage = Math.min(currentPage, data.totalPages);
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  if (normalizedSearch && total === 0) {
    searchRecovery = await traceServerStep(
      "resources.getSearchRecoveryData",
      () => getSearchRecoveryData(normalizedSearch),
      { query: normalizedSearch },
    );
  }

  const activeCategoryName =
    category === "all"
      ? "All categories"
      : categories.find((item) => item.slug === category)?.name ?? null;
  const isSearchResults = Boolean(normalizedSearch);
  const pageTitle = buildListingPageTitle({
    search,
    activeCategoryName,
    category,
  });
  const sortLabel =
    getMarketplaceSortOptions(Boolean(search?.trim())).find((option) => option.value === effectiveSort)?.label ??
    (Boolean(search?.trim()) ? SEARCH_SORT_OPTION.label : null) ??
    getMarketplaceSortOptions(false).find((option) => option.value === DEFAULT_SORT)?.label ??
    "Trending";
  const hasActiveFilters = !!(
    search?.trim() ||
    price !== "" ||
    sort !== DEFAULT_SORT ||
    tag ||
    featured === "true"
  );
  const resourceGridParams = new URLSearchParams();
  if (normalizedSearch) resourceGridParams.set("search", normalizedSearch);
  if (category) resourceGridParams.set("category", category);
  if (price) resourceGridParams.set("price", price);
  if (featured === "true") resourceGridParams.set("featured", "true");
  if (tag) resourceGridParams.set("tag", tag);
  if (effectiveSort !== DEFAULT_SORT) resourceGridParams.set("sort", effectiveSort);
  if (safePage > 1) resourceGridParams.set("page", String(safePage));
  const resourceGridQuery = resourceGridParams.toString();
  const resourceGridQueryKey = routes.marketplaceQuery(resourceGridQuery);
  const clearFiltersParams = new URLSearchParams();
  if (category) clearFiltersParams.set("category", category);
  const clearFiltersHref = routes.marketplaceQuery(clearFiltersParams);
  const resultsContext = buildResultsContext(
    total,
    activeCategoryName,
    category,
    search,
    price,
    formatNumber,
  );
  const spotlightCandidate = resources[0] ?? null;
  const spotlightResource =
    spotlightCandidate !== null &&
    !!spotlightCandidate.previewUrl &&
    !normalizedSearch &&
    ["trending", "downloads", "newest"].includes(sort)
      ? spotlightCandidate
      : null;
  const spotlightLabel =
    sort === "trending"
      ? "Trending this week"
      : sort === "downloads"
        ? "Popular right now"
        : activeCategoryName
          ? `Top in ${activeCategoryName}`
          : "Spotlight pick";
  const canShowCategoryRanks =
    category &&
    category !== "all" &&
    !normalizedSearch &&
    !tag &&
    !price &&
    featured !== "true" &&
    ["trending", "downloads", "newest"].includes(sort);
  const rankedResources = canShowCategoryRanks
    ? resources.map((resource, index) => ({
        ...resource,
        highlightBadge:
          index === 0
            ? sort === "trending"
              ? "#1 this week"
              : `#1 in ${activeCategoryName}`
            : index < 3
              ? `Top 3 in ${activeCategoryName}`
              : resource.highlightBadge ?? null,
        socialProofLabel:
          sort === "trending" && index < 2
            ? "Trending fast this week"
            : sort === "downloads" && index < 2
              ? "High demand right now"
              : resource.socialProofLabel ?? null,
      }))
    : resources;

  return (
    <>
      <section className="space-y-5 pb-7 sm:space-y-6 sm:pb-8">
        <div className="flex flex-col gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="font-ui text-caption tracking-[0.12em] text-text-muted">
              Browse
            </p>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              {pageTitle}
            </h1>
            {resultsContext ? (
              <p className="max-w-2xl text-small leading-6 text-text-secondary">
                {resultsContext}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
            <span className="font-medium text-text-primary">
              {formatNumber(total)} results
            </span>
            <span className="text-text-muted" aria-hidden>
              •
            </span>
            <span>{`Sorted by ${sortLabel}`}</span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="hidden lg:block">
            <Suspense fallback={<SidebarFallback />}>
              <FilterSidebar categories={categories as FilterCategory[]} />
            </Suspense>
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <Suspense fallback={<FilterBarFallback />}>
              <FilterBar total={total} />
            </Suspense>

            {spotlightResource ? (
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/85 to-white p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1.5">
                    <p className="font-ui text-caption tracking-[0.12em] text-primary-700">
                      {spotlightLabel}
                    </p>
                    <p className="max-w-2xl text-small leading-6 text-text-secondary">
                      Start with the clearest signal in {(activeCategoryName ?? "the marketplace").toLowerCase()} before
                      you scan the rest of the collection.
                    </p>
                  </div>
                  <IntentPrefetchLink
                    href={routes.resource(spotlightResource.slug)}
                    prefetchMode="intent"
                    prefetchScope="spotlight-resource"
                    prefetchLimit={1}
                    resourcesNavigationMode="detail"
                    className="inline-flex items-center gap-1 text-small font-medium text-primary-700 transition hover:text-primary-800"
                  >
                    View resource
                    <ArrowRight className="h-4 w-4" />
                  </IntentPrefetchLink>
                </div>
                <ViewerAwareResourceCard
                  resource={{
                    ...spotlightResource,
                    highlightBadge: spotlightLabel,
                  }}
                  variant="hero"
                  linkPrefetchMode="viewport"
                />
              </div>
            ) : null}

            {isSearchResults ? (
              <p className="text-small text-text-secondary">
                {total === 0 ? (
                  <>
                    No results for{" "}
                    <strong className="text-text-primary">&ldquo;{normalizedSearch}&rdquo;</strong>.
                  </>
                ) : (
                  <>
                    Showing results for{" "}
                    <strong className="text-text-primary">&ldquo;{normalizedSearch}&rdquo;</strong>.
                  </>
                )}
              </p>
            ) : null}

            <ViewerAwareResourceGrid
              resources={rankedResources}
              total={total}
              page={safePage}
              totalPages={totalPages}
              hasActiveFilters={hasActiveFilters}
              progressiveLoad
              cardPrefetchMode="viewport"
              emptyState={
                normalizedSearch && searchRecovery ? (
                  <SearchRecoveryPanel
                    query={normalizedSearch}
                    recovery={searchRecovery}
                  />
                ) : undefined
              }
              routeContext={{
                queryKey: resourceGridQueryKey,
                clearFiltersHref,
                exploreAllHref: routes.marketplace,
                cardPrefetchScope: `resource-card-grid:${resourceGridQueryKey}`,
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}

async function ResourcesDiscoverContent() {
  const discoverDataPromise = trackRequestWork(loadDiscoverDataSafe());

  return (
    <Suspense fallback={<DiscoverSectionsSkeleton />}>
      <ResourcesDiscoverDeferredSections discoverDataPromise={discoverDataPromise} />
    </Suspense>
  );
}

async function ResourcesDiscoverDeferredSections({
  discoverDataPromise,
}: {
  discoverDataPromise: Promise<DiscoverData | null>;
}) {
  const discoverData = await discoverDataPromise;

  if (!discoverData) {
    return null;
  }

  const globalFiltered = discoverData.recommended as ResourceCardData[];

  return (
    <div className="space-y-16 lg:space-y-20">
      {discoverData.trending.length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Trending now"
            description="Ranked by recent sales momentum, recent revenue, rating quality, and review volume to surface the strongest current picks."
            viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(discoverData.trending as ResourceCardData[]).map((resource, index) => (
              <ViewerAwareResourceCard
                key={resource.id}
                resource={{
                  ...resource,
                  highlightBadge: index < 2 ? "Trending this week" : null,
                  socialProofLabel: index < 2 ? "Trending fast this week" : null,
                }}
                variant="marketplace"
                linkPrefetchMode="viewport"
              />
            ))}
          </div>
        </section>
      ) : null}

      {discoverData.topCreator?.creator.creatorSlug ? (
        <section className="rounded-[22px] border border-surface-200 bg-surface-50/75 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-ui text-caption tracking-[0.12em] text-primary-700">
                Top creator this week
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
                {discoverData.topCreator.creator.creatorDisplayName ??
                  discoverData.topCreator.creator.name ??
                  "Top creator"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {discoverData.topCreator.last7dRevenue > 0
                  ? `${formatPrice(discoverData.topCreator.last7dRevenue / 100)} generated this week with ${formatNumber(discoverData.topCreator.last30dDownloads)} recent downloads across ${formatNumber(discoverData.topCreator.resources)} resources.`
                  : `${formatNumber(discoverData.topCreator.last30dDownloads)} recent downloads across ${formatNumber(discoverData.topCreator.resources)} resources are giving this creator extra visibility right now.`}
              </p>
              {discoverData.topCreator.creator.creatorBio ? (
                <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                  {discoverData.topCreator.creator.creatorBio}
                </p>
              ) : null}
            </div>
            <IntentPrefetchLink
              href={routes.creatorPublicProfile(discoverData.topCreator.creator.creatorSlug)}
              className="inline-flex items-center gap-2 self-start rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition hover:border-surface-300 hover:bg-white lg:self-auto"
              prefetchMode="intent"
              prefetchScope="top-creator-cta"
              prefetchLimit={1}
            >
              Explore creator
              <ArrowRight className="h-4 w-4" />
            </IntentPrefetchLink>
          </div>
        </section>
      ) : null}

      <ResourcesDiscoverPersonalizedSection fallbackCards={globalFiltered.slice(0, 5)} />

      {discoverData.newReleases.length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="New releases"
            description="Fresh additions from creators and educators, surfaced with the newest material first."
            viewAllHref={routes.marketplaceQuery("sort=newest&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(discoverData.newReleases as ResourceCardData[]).map((resource) => (
              <ViewerAwareResourceCard
                key={resource.id}
                resource={resource}
                variant="marketplace"
                linkPrefetchMode="viewport"
              />
            ))}
          </div>
        </section>
      ) : null}

      {discoverData.featured.length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Featured picks"
            viewAllHref={routes.marketplaceQuery("sort=featured&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(discoverData.featured as ResourceCardData[]).map((resource) => (
              <ViewerAwareResourceCard
                key={resource.id}
                resource={resource}
                variant="marketplace"
                linkPrefetchMode="viewport"
              />
            ))}
          </div>
        </section>
      ) : null}

      {discoverData.freeResources.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Free resources"
            viewAllHref={routes.marketplaceQuery("price=free&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(discoverData.freeResources as ResourceCardData[]).map((resource) => (
              <ViewerAwareResourceCard
                key={resource.id}
                resource={resource}
                variant="marketplace"
                linkPrefetchMode="viewport"
              />
            ))}
          </div>
        </section>
      ) : null}

      {discoverData.mostDownloaded.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Most downloaded"
            viewAllHref={routes.marketplaceQuery("sort=downloads&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(discoverData.mostDownloaded as ResourceCardData[]).map((resource, index) => (
              <ViewerAwareResourceCard
                key={resource.id}
                resource={{
                  ...resource,
                  highlightBadge: index < 2 ? "Popular right now" : null,
                  socialProofLabel: index < 2 ? "High demand right now" : null,
                }}
                variant="marketplace"
                linkPrefetchMode="viewport"
              />
            ))}
          </div>
        </section>
      ) : null}

      <CreatorCTA />
      {BLOG_SECTION_ENABLED ? <BlogSection /> : null}
      <EmailSignup />
    </div>
  );
}

async function loadDiscoverDataSafe(): Promise<DiscoverData | null> {
  try {
    return await traceServerStep("resources.getDiscoverData", () =>
      getDiscoverData(),
    );
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    return null;
  }
}

function buildResultsContext(
  total: number,
  activeCategoryName: string | null,
  category: string | undefined,
  search: string | undefined,
  price: string,
  formatNum: (n: number) => string,
): string | null {
  if (total === 0) return null;

  const n = total === 1 ? "1 resource" : `${formatNum(total)} resources`;
  const inAll = "across all categories";
  const inCat = activeCategoryName ? `in ${activeCategoryName}` : inAll;
  const scope = category === "all" || !activeCategoryName ? inAll : inCat;
  const term = search?.trim();

  if (term) {
    return `${n} ${scope} matching "${term}"`;
  }
  if (price === "free") {
    return `${n} available for free ${scope}`;
  }
  if (price === "paid") {
    return `${n} available ${scope}`;
  }
  return `${n} ${scope}`;
}

function buildListingPageTitle({
  search,
  activeCategoryName,
  category,
}: {
  search: string | undefined;
  activeCategoryName: string | null;
  category: string | undefined;
}) {
  if (search?.trim()) {
    if (category && category !== "all" && activeCategoryName) {
      return `Search results in ${activeCategoryName}`;
    }

    return "Search results";
  }

  if (category === "all") {
    return "Explore all categories";
  }

  if (activeCategoryName) {
    return `Explore ${activeCategoryName}`;
  }

  return "Explore resources";
}

function SectionHeader({
  title,
  description,
  viewAllHref,
}: {
  title: string;
  description?: string;
  viewAllHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-surface-200/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
      </div>
      <IntentPrefetchLink
        href={viewAllHref}
        prefetchMode="intent"
        prefetchScope="resources-section-view-all"
        prefetchLimit={2}
        resourcesNavigationMode="listing"
        className="group inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-small font-medium text-primary-700 transition-colors hover:bg-primary-50 hover:text-primary-800 sm:self-auto"
      >
        <span className="inline-flex items-center gap-1">
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </IntentPrefetchLink>
    </div>
  );
}

function FilterBarFallback() {
  return (
    <div className="flex flex-col gap-3 border-b border-surface-200/80 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <LoadingSkeleton className="h-5 w-24 rounded-md" />
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
        <LoadingSkeleton className="h-11 w-full rounded-full border border-surface-200 bg-white sm:w-28" />
        <LoadingSkeleton className="h-11 w-full rounded-full border border-surface-200 bg-primary-50/70 sm:w-36" />
        <LoadingSkeleton className="h-11 w-16 rounded-full sm:w-20" />
      </div>
    </div>
  );
}

function SidebarFallbackGroup({
  titleWidth,
  rowWidths,
  pillWidths,
}: {
  titleWidth: string;
  rowWidths?: string[];
  pillWidths?: string[];
}) {
  return (
    <div className="border-b border-surface-200/80 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <LoadingSkeleton className={`h-4 rounded ${titleWidth}`} />
        <LoadingSkeleton className="h-4 w-4 rounded" />
      </div>

      {rowWidths ? (
        <div className="space-y-0.5">
          {rowWidths.map((width, index) => (
            <LoadingSkeleton
              key={`${titleWidth}-row-${index}`}
              className={`h-10 rounded-xl ${width}`}
            />
          ))}
        </div>
      ) : null}

      {pillWidths ? (
        <div className="flex flex-wrap gap-2">
          {pillWidths.map((width, index) => (
            <LoadingSkeleton
              key={`${titleWidth}-pill-${index}`}
              className={`h-8 rounded-full border border-surface-200 bg-white ${width}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarFallback() {
  return (
    <div className="w-[260px] flex-shrink-0 space-y-5">
      <div className="flex items-center justify-between border-b border-surface-200/80 pb-2">
        <LoadingSkeleton className="h-4 w-12 rounded" />
        <LoadingSkeleton className="h-4 w-14 rounded" />
      </div>
      <SidebarFallbackGroup
        titleWidth="w-12"
        rowWidths={["w-full", "w-5/6", "w-3/4", "w-[92%]", "w-[88%]", "w-[80%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-16"
        rowWidths={["w-full", "w-[90%]", "w-[84%]", "w-[72%]", "w-[76%]", "w-[68%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-12"
        rowWidths={["w-full", "w-4/5", "w-[70%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-20"
        pillWidths={["w-24", "w-28", "w-24"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-24"
        pillWidths={["w-20", "w-28", "w-24"]}
      />
    </div>
  );
}

function DeferredSectionFallback({
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

function DiscoverSectionsSkeleton() {
  return (
    <div className="space-y-16 lg:space-y-20">
      <DeferredSectionFallback titleWidth="w-52" cardCount={5} />
      <DeferredSectionFallback titleWidth="w-40" cardCount={4} />
    </div>
  );
}

export function ResourcesContentFallback({ isDiscoverMode }: { isDiscoverMode: boolean }) {
  return (
    <>
      {!isDiscoverMode ? <ResourcesIntroSectionSkeleton isDiscoverMode={false} /> : null}

      {isDiscoverMode ? (
        <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {Array.from({ length: 8 }).map((_, index) => (
            <ResourceCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <section className="space-y-6">
          <div className="space-y-5 pb-7 sm:pb-8">
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="h-8 w-56 rounded-lg" />
            <LoadingSkeleton className="h-4 w-72" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            <div className="hidden lg:block">
              <SidebarFallback />
            </div>

            <div className="min-w-0 flex-1 space-y-5">
              <FilterBarFallback />
              <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ResourceCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
