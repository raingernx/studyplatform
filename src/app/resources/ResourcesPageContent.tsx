import Image from "next/image";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { isMissingTableError } from "@/lib/prismaErrors";
import { LazyResourcesDiscoverPersonalizedSection } from "@/components/resources/LazyResourcesDiscoverPersonalizedSection";
import { ResourcesViewerStateProvider } from "@/components/resources/ResourcesViewerStateProvider";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { ViewerAwareResourceCard } from "@/components/resources/ViewerAwareResourceCard";
import { ViewerAwareResourceGrid } from "@/components/resources/ViewerAwareResourceGrid";
import {
  SearchRecoveryPanel,
  SearchRecoveryPanelFallback,
} from "@/components/resources/SearchRecoveryPanel";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { HeroBanner } from "@/components/marketplace/HeroBanner";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { CategoryBrowseCardLink } from "@/components/marketplace/CategoryBrowseCardLink";
import { FilterSidebar, type FilterCategory } from "@/components/marketplace/FilterSidebar";
import { CreatorCTA } from "@/components/discover/CreatorCTA";
import { BlogSection } from "@/components/discover/BlogSection";
import { EmailSignup } from "@/components/discover/EmailSignup";
import { ResourcesDiscoverSectionsSkeleton } from "@/components/skeletons/ResourcesDiscoverSectionsSkeleton";
import {
  FilterBarFallback,
  ResourcesContentFallback,
  SidebarFallback,
} from "@/components/skeletons/ResourcesContentFallback";
import { formatNumber, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getDiscoverData,
  type DiscoverData,
} from "@/services/discover";
import { getSearchRecoveryData } from "@/services/search";
import {
  DEFAULT_SORT,
  getMarketplaceSortOptions,
  SEARCH_SORT_OPTION,
} from "@/config/sortOptions";
import { MARKETPLACE_LISTING_PAGE_SIZE } from "@/config/marketplace";
import { getMarketplaceResources } from "@/services/resources";
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
  return <HeroBanner className={className} />;
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
  return isDiscoverMode
    ? <ResourcesDiscoverContent />
    : (
        <ResourcesListingContent
          search={search}
          category={category}
          price={price}
          featured={featured}
          tag={tag}
          sort={sort}
          effectiveSort={effectiveSort}
          currentPage={currentPage}
        />
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

  const isEmptySearchResults = normalizedSearch.length > 0 && total === 0;
  const searchRecoveryPromise = isEmptySearchResults
    ? trackRequestWork(
        traceServerStep(
          "resources.getSearchRecoveryData",
          () => getSearchRecoveryData(normalizedSearch),
          { query: normalizedSearch },
        ),
      )
    : null;

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
            <p className="font-ui text-caption tracking-[0.12em] text-muted-foreground">
              Browse
            </p>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {pageTitle}
            </h1>
            {resultsContext ? (
              <p className="max-w-2xl text-small leading-6 text-muted-foreground">
                {resultsContext}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatNumber(total)} results
            </span>
            <span className="text-muted-foreground" aria-hidden>
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

            {isSearchResults ? (
              <p className="text-small text-muted-foreground">
                {total === 0 ? (
                  <>
                    No results for{" "}
                    <strong className="text-foreground">&ldquo;{normalizedSearch}&rdquo;</strong>.
                  </>
                ) : (
                  <>
                    Showing results for{" "}
                    <strong className="text-foreground">&ldquo;{normalizedSearch}&rdquo;</strong>.
                  </>
                )}
              </p>
            ) : null}

            {isEmptySearchResults ? (
              <Suspense fallback={<SearchRecoveryPanelFallback />}>
                {searchRecoveryPromise ? (
                  <SearchRecoveryPanelDeferred
                    query={normalizedSearch}
                    recoveryPromise={searchRecoveryPromise}
                  />
                ) : null}
              </Suspense>
            ) : (
              <ResourcesViewerStateProvider>
                {spotlightResource ? (
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-4 shadow-sm sm:p-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="font-ui text-caption tracking-[0.12em] text-primary">
                            {spotlightLabel}
                          </p>
                          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                            Start with the strongest pick first
                          </h2>
                          <p className="max-w-2xl text-small leading-6 text-muted-foreground">
                            Use this highlighted pick as your first stop in {(activeCategoryName ?? "the marketplace").toLowerCase()} before
                            you scan the rest of the collection.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
                            {sortLabel}
                          </span>
                          {activeCategoryName ? (
                            <span className="inline-flex items-center rounded-full border border-border-strong bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                              {activeCategoryName}
                            </span>
                          ) : null}
                        </div>

                        <IntentPrefetchLink
                          href={routes.resource(spotlightResource.slug)}
                          prefetchMode="intent"
                          prefetchScope="spotlight-resource"
                          prefetchLimit={1}
                          resourcesNavigationMode="detail"
                          className="inline-flex items-center gap-1 text-small font-medium text-primary transition hover:text-primary"
                        >
                          View resource
                          <ArrowRight className="h-4 w-4" />
                        </IntentPrefetchLink>
                      </div>

                      <div className="w-full max-w-[320px] justify-self-start lg:justify-self-end">
                        <div className="rounded-[1.35rem] border border-border-strong bg-background/85 p-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.48)]">
                          <ViewerAwareResourceCard
                            resource={{
                              ...spotlightResource,
                              highlightBadge: spotlightLabel,
                            }}
                            variant="marketplace"
                            linkPrefetchMode="viewport"
                            imageLoading="eager"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <ViewerAwareResourceGrid
                  resources={rankedResources}
                  total={total}
                  page={safePage}
                  totalPages={totalPages}
                  hasActiveFilters={hasActiveFilters}
                  progressiveLoad
                  cardPrefetchMode="viewport"
                  routeContext={{
                    queryKey: resourceGridQueryKey,
                    clearFiltersHref,
                    exploreAllHref: routes.marketplace,
                    cardPrefetchScope: `resource-card-grid:${resourceGridQueryKey}`,
                  }}
                />
              </ResourcesViewerStateProvider>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

async function ResourcesDiscoverContent() {
  const discoverDataPromise = trackRequestWork(loadDiscoverDataSafe());

  return (
    <Suspense fallback={<ResourcesDiscoverSectionsSkeleton />}>
      <ResourcesDiscoverDeferredSections discoverDataPromise={discoverDataPromise} />
    </Suspense>
  );
}

function getResourcePreviewUrl(resource: ResourceCardData) {
  return resource.thumbnailUrl ?? resource.previewImages?.[0] ?? resource.previewUrl ?? null;
}

async function ResourcesDiscoverDeferredSections({
  discoverDataPromise,
}: {
  discoverDataPromise: Promise<DiscoverData | null>;
}) {
  const eagerDiscoverCardCount = 4;
  const eagerDiscoverPreviewUrls = new Set<string>();
  const discoverData = await discoverDataPromise;

  if (!discoverData) {
    return null;
  }

  const resolveDiscoverImageLoading = (
    resource: ResourceCardData,
    index: number,
  ) => {
    const previewUrl = getResourcePreviewUrl(resource);
    const shouldEager =
      index < eagerDiscoverCardCount ||
      (previewUrl !== null && eagerDiscoverPreviewUrls.has(previewUrl));

    if (shouldEager && previewUrl) {
      eagerDiscoverPreviewUrls.add(previewUrl);
    }

    return shouldEager ? "eager" : undefined;
  };
  const globalFiltered = discoverData.recommended as ResourceCardData[];
  const quickBrowseTiles = [
    {
      title: "Top picks",
      description: "A tighter shortlist ranked to surface strong marketplace picks first.",
      href: routes.marketplaceQuery("sort=recommended&category=all"),
      eyebrow: "Browse",
    },
    {
      title: "Worksheets",
      description: "Jump straight into printable practice materials and guided exercises.",
      href: routes.marketplaceQuery("tag=worksheet&sort=newest"),
      eyebrow: "Format",
    },
    {
      title: "Flashcards",
      description: "Review-ready cards for memorisation, recall, and speaking drills.",
      href: routes.marketplaceQuery("tag=flashcards&sort=trending"),
      eyebrow: "Format",
    },
    {
      title: "Free to start",
      description: "Open free resources first, then decide what is worth saving or buying.",
      href: routes.marketplaceQuery("price=free&category=all"),
      eyebrow: "Budget",
    },
  ] as const;
  const curatedCollections = [
    discoverData.newReleases[0]
      ? {
          key: "new-releases",
          title: "New releases",
          description: "Fresh uploads from creators and educators added most recently.",
          href: routes.marketplaceQuery("sort=newest&category=all"),
          badge: "Fresh",
          resource: discoverData.newReleases[0] as ResourceCardData,
        }
      : null,
    discoverData.featured[0]
      ? {
          key: "featured-picks",
          title: "Featured picks",
          description: "Editor-shaped highlights for browsing with a little more curation.",
          href: routes.marketplaceQuery("featured=true&category=all"),
          badge: "Featured",
          resource: discoverData.featured[0] as ResourceCardData,
        }
      : null,
    discoverData.mostDownloaded[0]
      ? {
          key: "most-downloaded",
          title: "Most downloaded",
          description: "Reliable bestsellers with strong learner demand right now.",
          href: routes.marketplaceQuery("sort=downloads&category=all"),
          badge: "Popular",
          resource: discoverData.mostDownloaded[0] as ResourceCardData,
        }
      : null,
  ].filter((tile) => tile !== null);

  return (
    <div className="space-y-16 lg:space-y-20">
      <section className="space-y-5">
        <SectionHeader
          title="Start with a clearer path"
          description="Browse by intent first so the marketplace feels closer to a toolkit than a wall of cards."
          viewAllHref={routes.marketplace}
          viewAllLabel="Browse everything"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickBrowseTiles.map((tile) => (
            <DiscoverBrowseCard
              key={tile.title}
              title={tile.title}
              description={tile.description}
              href={tile.href}
              eyebrow={tile.eyebrow}
            />
          ))}
        </div>
      </section>

      <ResourcesViewerStateProvider>
        <LazyResourcesDiscoverPersonalizedSection
          fallbackCards={globalFiltered.slice(0, eagerDiscoverCardCount)}
          eagerCardCount={eagerDiscoverCardCount}
          eagerPreviewUrls={[...eagerDiscoverPreviewUrls]}
        />

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
                  imageLoading={resolveDiscoverImageLoading(resource, index)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </ResourcesViewerStateProvider>

      {curatedCollections.length > 0 || discoverData.topCreator?.creator.creatorSlug ? (
        <section className="space-y-5">
          <SectionHeader
            title="Collections to explore"
            description="A smaller set of curated paths gives the page more shape than stacking another four rows of cards."
            viewAllHref={routes.marketplace}
            viewAllLabel="Open marketplace"
          />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {curatedCollections.map((tile) => (
              <DiscoverCollectionCard
                key={tile.key}
                title={tile.title}
                description={tile.description}
                href={tile.href}
                badge={tile.badge}
                resource={tile.resource}
              />
            ))}
            {discoverData.topCreator?.creator.creatorSlug ? (
              <TopCreatorSpotlightCard
                href={routes.creatorPublicProfile(discoverData.topCreator.creator.creatorSlug)}
                name={
                  discoverData.topCreator.creator.creatorDisplayName ??
                  discoverData.topCreator.creator.name ??
                  "Top creator"
                }
                description={
                  discoverData.topCreator.last7dRevenue > 0
                    ? `${formatPrice(discoverData.topCreator.last7dRevenue / 100)} generated this week with ${formatNumber(discoverData.topCreator.last30dDownloads)} recent downloads.`
                    : `${formatNumber(discoverData.topCreator.last30dDownloads)} recent downloads across ${formatNumber(discoverData.topCreator.resources)} resources.`
                }
                bio={discoverData.topCreator.creator.creatorBio ?? null}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <CreatorCTA />
      {BLOG_SECTION_ENABLED ? <BlogSection /> : null}
      <EmailSignup />
    </div>
  );
}

async function SearchRecoveryPanelDeferred({
  query,
  recoveryPromise,
}: {
  query: string;
  recoveryPromise: Promise<Awaited<ReturnType<typeof getSearchRecoveryData>>>;
}) {
  const recovery = await recoveryPromise;

  return <SearchRecoveryPanel query={query} recovery={recovery} />;
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
  viewAllLabel = "View all",
}: {
  title: string;
  description?: string;
  viewAllHref: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <IntentPrefetchLink
        href={viewAllHref}
        prefetchMode="intent"
        prefetchScope="resources-section-view-all"
        prefetchLimit={2}
        resourcesNavigationMode="listing"
        className="group inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-small font-medium text-primary transition-colors hover:bg-primary/12 hover:text-primary sm:self-auto"
      >
        <span className="inline-flex items-center gap-1">
          <span>{viewAllLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </IntentPrefetchLink>
    </div>
  );
}

function DiscoverBrowseCard({
  title,
  description,
  href,
  eyebrow,
}: {
  title: string;
  description: string;
  href: string;
  eyebrow: string;
}) {
  return (
    <CategoryBrowseCardLink
      href={href}
      className="group rounded-[24px] border border-border-subtle bg-card p-5 shadow-sm transition hover:border-primary/25 hover:bg-primary/10 hover:shadow-card"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="space-y-2">
          <p className="font-ui text-caption tracking-[0.12em] text-primary">{eyebrow}</p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition group-hover:text-primary">
          Explore
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </CategoryBrowseCardLink>
  );
}

function DiscoverCollectionCard({
  title,
  description,
  href,
  badge,
  resource,
}: {
  title: string;
  description: string;
  href: string;
  badge?: string;
  resource: ResourceCardData;
}) {
  const previewUrl = getResourcePreviewUrl(resource);

  return (
    <IntentPrefetchLink
      href={href}
      prefetchMode="intent"
      prefetchScope="discover-collection-card"
      prefetchLimit={4}
      resourcesNavigationMode="listing"
      className="group overflow-hidden rounded-[24px] border border-border-subtle bg-card shadow-sm transition hover:border-primary/25 hover:shadow-card"
    >
      <div className="flex h-full flex-col">
        <div className="relative aspect-[5/3] overflow-hidden border-b border-border bg-muted">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover transition duration-200 group-hover:scale-[1.02]"
            />
          ) : null}
          {badge ? (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-border-strong/90 bg-background/92 px-2.5 py-1 text-[11px] font-medium text-primary shadow-sm backdrop-blur-sm">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <p className="line-clamp-2 text-sm font-medium text-foreground">{resource.title}</p>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition group-hover:text-primary">
            Open collection
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </IntentPrefetchLink>
  );
}

function TopCreatorSpotlightCard({
  href,
  name,
  description,
  bio,
}: {
  href: string;
  name: string;
  description: string;
  bio: string | null;
}) {
  return (
    <IntentPrefetchLink
      href={href}
      prefetchMode="intent"
      prefetchScope="top-creator-spotlight"
      prefetchLimit={1}
      className="group rounded-[24px] border border-border-subtle bg-muted/80 p-5 shadow-sm transition hover:border-primary/25 hover:bg-card hover:shadow-card"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="space-y-2">
          <p className="font-ui text-caption tracking-[0.12em] text-primary">Creator spotlight</p>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{name}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          {bio ? <p className="line-clamp-3 text-sm text-muted-foreground">{bio}</p> : null}
        </div>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition group-hover:text-primary">
          Explore creator
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </IntentPrefetchLink>
  );
}
