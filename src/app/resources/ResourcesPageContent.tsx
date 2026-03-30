import { Suspense, type ReactNode } from "react";
import { Prisma } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { isMissingTableError } from "@/lib/prismaErrors";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceGridOwnedIdsHydrator } from "@/components/resources/ResourceGrid";
import { ResourceCard, type ResourceCardData } from "@/components/resources/ResourceCard";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
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
import { SORT_OPTIONS } from "@/config/sortOptions";
import { getOwnedResourceIds, getUserLearningProfile } from "@/services/purchase.service";
import {
  getCachedNewResourcesInCategories,
  getCachedRecommendedResourcesByLevels,
  getMarketplaceResources,
} from "@/services/resources/public-resource-read.service";
import { getBehaviorBasedRecommendations, getPhase1Recommendations } from "@/services/recommendations/behavior-profile.service";
import {
  assignRecommendationVariant,
  RECOMMENDATION_EXPERIMENT_ID,
  type RecommendationVariant,
} from "@/lib/recommendations/experiment";
import { RecommendationSection } from "@/components/recommendations/RecommendationSection";
import { ResourcesIntroSectionSkeleton } from "@/components/skeletons/ResourcesIntroSectionSkeleton";
import { recordAnalyticsEvents } from "@/analytics/event.service";
import {
  trackRequestWork,
  traceServerStep,
} from "@/lib/performance/observability";

const ITEMS_PER_PAGE = 12;
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
  userId?: string;
};

function isNewCardBadge(createdAt?: Date | string) {
  if (!createdAt) return false;
  const date = new Date(createdAt);
  return (Date.now() - date.getTime()) / 86_400_000 < 14;
}

function DefaultCardBadge({
  createdAt,
  featured,
}: {
  createdAt?: Date | string;
  featured?: boolean;
}) {
  const base =
    "absolute left-3 top-3 rounded-full border px-2.5 py-1 text-caption font-medium backdrop-blur-sm";

  if (featured) {
    return <span className={`${base} border-amber-100 bg-amber-50/95 text-amber-700`}>Featured</span>;
  }

  if (isNewCardBadge(createdAt)) {
    return <span className={`${base} border-info-100 bg-info-50/95 text-info-700`}>New</span>;
  }

  return null;
}

async function ResolvedOwnedCardBadge({
  ownedIdsPromise,
  resourceId,
  createdAt,
  featured,
}: {
  ownedIdsPromise: Promise<Set<string>>;
  resourceId: string;
  createdAt?: Date | string;
  featured?: boolean;
}) {
  const ownedIds = await ownedIdsPromise;

  if (ownedIds.has(resourceId)) {
    return (
      <span className="absolute left-3 top-3 rounded-full border border-primary-100 bg-primary-50/95 px-2.5 py-1 text-caption font-medium text-primary-700 backdrop-blur-sm">
        Owned
      </span>
    );
  }

  return <DefaultCardBadge createdAt={createdAt} featured={featured} />;
}

async function ResolvedOwnedIdsHydrator({
  ownedIdsPromise,
}: {
  ownedIdsPromise: Promise<Set<string>>;
}) {
  const ownedIds = await ownedIdsPromise;

  return <ResourceGridOwnedIdsHydrator ownedIds={[...ownedIds]} />;
}

function DeferredOwnedIdsHydrator({
  ownedIdsPromise,
}: {
  ownedIdsPromise: Promise<Set<string>>;
}) {
  return (
    <Suspense fallback={null}>
      <ResolvedOwnedIdsHydrator ownedIdsPromise={ownedIdsPromise} />
    </Suspense>
  );
}

function DeferredOwnedCardBadge({
  ownedIdsPromise,
  resource,
}: {
  ownedIdsPromise: Promise<Set<string>>;
  resource: Pick<ResourceCardData, "id" | "createdAt" | "featured">;
}) {
  return (
    <Suspense
      fallback={<DefaultCardBadge createdAt={resource.createdAt} featured={resource.featured} />}
    >
      <ResolvedOwnedCardBadge
        ownedIdsPromise={ownedIdsPromise}
        resourceId={resource.id}
        createdAt={resource.createdAt}
        featured={resource.featured}
      />
    </Suspense>
  );
}

function ResourceCardWithDeferredOwnedBadge({
  resource,
  ownedIdsPromise,
  variant = "marketplace",
  priority = false,
  linkPrefetchMode = "intent",
}: {
  resource: ResourceCardData;
  ownedIdsPromise: Promise<Set<string>> | null;
  variant?: "marketplace" | "hero";
  priority?: boolean;
  linkPrefetchMode?: "intent" | "viewport" | "none";
}) {
  return (
    <ResourceCard
      resource={resource}
      variant={variant}
      owned={false}
      priority={priority}
      linkPrefetchMode={linkPrefetchMode}
      badge={
        ownedIdsPromise ? (
          <DeferredOwnedCardBadge ownedIdsPromise={ownedIdsPromise} resource={resource} />
        ) : undefined
      }
    />
  );
}

export async function ResourcesDiscoverHero({
  userId,
  className,
}: {
  userId?: string;
  className?: string;
}) {
  let heroConfig: Awaited<ReturnType<typeof getHeroConfig>> = null;

  try {
    heroConfig = await traceServerStep(
      "resources.getHeroConfig",
      () => getHeroConfig({ userId }),
      { personalized: Boolean(userId) },
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
  userId,
}: ResourcesPageContentProps) {
  if (isDiscoverMode) {
    return ResourcesDiscoverContent({ userId });
  }

  const ownedIdsPromise = userId
    ? trackRequestWork(loadOwnedIdsSafe(userId))
    : null;

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
          pageSize: ITEMS_PER_PAGE,
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

  const activeCategoryName =
    category === "all"
      ? "All categories"
      : categories.find((item) => item.slug === category)?.name ?? "Browse resources";
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest";
  const hasActiveFilters = !!(search?.trim() || price !== "" || sort !== "newest" || tag || featured === "true");
  const resourceGridParams = new URLSearchParams();
  if (search?.trim()) resourceGridParams.set("search", search.trim());
  if (category) resourceGridParams.set("category", category);
  if (price) resourceGridParams.set("price", price);
  if (featured === "true") resourceGridParams.set("featured", "true");
  if (tag) resourceGridParams.set("tag", tag);
  if (effectiveSort !== "newest") resourceGridParams.set("sort", effectiveSort);
  if (safePage > 1) resourceGridParams.set("page", String(safePage));
  const resourceGridQuery = resourceGridParams.toString();
  const resourceGridQueryKey = routes.marketplaceQuery(resourceGridQuery);
  const clearFiltersParams = new URLSearchParams();
  if (category) clearFiltersParams.set("category", category);
  const clearFiltersHref = routes.marketplaceQuery(clearFiltersParams);
  const resultsContext = buildResultsContext(total, activeCategoryName, category, search, price, formatNumber);
  const spotlightCandidate = resources[0] ?? null;
  const spotlightResource =
    !isDiscoverMode &&
    spotlightCandidate !== null &&
    !!spotlightCandidate.previewUrl &&
    !search?.trim() &&
    ["trending", "downloads", "newest"].includes(sort)
      ? spotlightCandidate
      : null;
  const spotlightLabel =
    sort === "trending"
      ? "Trending this week"
      : sort === "downloads"
        ? "Popular right now"
        : activeCategoryName !== "Browse resources"
          ? `Top in ${activeCategoryName}`
          : "Spotlight pick";
  const canShowCategoryRanks =
    !isDiscoverMode &&
    category &&
    category !== "all" &&
    !search?.trim() &&
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
  const resourceGridBadgeNodes = ownedIdsPromise
    ? rankedResources.map((resource) => (
        <DeferredOwnedCardBadge
          key={`owned-grid:${resource.id}`}
          ownedIdsPromise={ownedIdsPromise}
          resource={resource}
        />
      ))
    : undefined;

  return (
    <>
      <section className="space-y-5 pb-7 sm:space-y-6 sm:pb-8">
        <div className="flex flex-col gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="font-ui text-caption tracking-[0.12em] text-text-muted">
              Browse
            </p>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              {`Explore ${activeCategoryName}`}
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
                      Start with the clearest signal in {activeCategoryName.toLowerCase()} before
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
                <ResourceCard
                  resource={{
                    ...spotlightResource,
                    highlightBadge: spotlightLabel,
                  }}
                  variant="hero"
                  owned={false}
                  linkPrefetchMode="intent"
                  badge={
                    ownedIdsPromise ? (
                      <DeferredOwnedCardBadge
                        ownedIdsPromise={ownedIdsPromise}
                        resource={spotlightResource}
                      />
                    ) : undefined
                  }
                />
              </div>
            ) : null}

            {search?.trim() ? (
              <p className="text-small text-text-secondary">
                {total === 0 ? (
                  <>
                    No results for{" "}
                    <strong className="text-text-primary">&ldquo;{search.trim()}&rdquo;</strong>.
                  </>
                ) : (
                  <>
                    Showing results for{" "}
                    <strong className="text-text-primary">&ldquo;{search.trim()}&rdquo;</strong>.
                  </>
                )}
              </p>
            ) : null}

            <ResourceGrid
              resources={rankedResources}
              ownedIds={[]}
              total={total}
              page={safePage}
              totalPages={totalPages}
              hasActiveFilters={hasActiveFilters}
              progressiveLoad
              cardPrefetchMode="intent"
              badgeNodes={resourceGridBadgeNodes}
              deferredOwnedIdsHydrator={
                ownedIdsPromise ? (
                  <DeferredOwnedIdsHydrator ownedIdsPromise={ownedIdsPromise} />
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

async function AwaitResolvedNode({
  promise,
}: {
  promise: Promise<ReactNode>;
}) {
  return <>{await promise}</>;
}

async function ResourcesDiscoverContent({ userId }: { userId?: string }) {
  const discoverDataPromise = trackRequestWork(loadDiscoverDataSafe());
  const ownedIdsPromise = userId
    ? trackRequestWork(loadOwnedIdsSafe(userId))
    : null;
  const learningProfilePromise = userId
    ? trackRequestWork(loadLearningProfileSafe(userId))
    : null;
  const sectionsPromise = trackRequestWork(
    ResourcesDiscoverDeferredSections({
      discoverDataPromise,
      ownedIdsPromise,
      learningProfilePromise,
      userId,
    }),
  );

  return (
    <>
      <Suspense fallback={<DiscoverSectionsFallback />}>
        <AwaitResolvedNode promise={sectionsPromise} />
      </Suspense>
    </>
  );
}

async function ResourcesDiscoverDeferredSections({
  discoverDataPromise,
  ownedIdsPromise,
  learningProfilePromise,
  userId,
}: {
  discoverDataPromise: Promise<DiscoverData | null>;
  ownedIdsPromise: Promise<Set<string>> | null;
  learningProfilePromise: Promise<Awaited<ReturnType<typeof getUserLearningProfile>> | null> | null;
  userId?: string;
}) {
  const discoverData = await discoverDataPromise;
  const ownedIds = new Set<string>();

  if (!discoverData) {
    return null;
  }

  const globalFiltered = (discoverData.recommended as ResourceCardData[]).filter(
    (resource) => !ownedIds.has(resource.id),
  );
  const recommendationVariant = userId ? assignRecommendationVariant(userId) : null;
  // Two independent Suspense paths instead of one deeply nested chain:
  //   A) RFY section — single Suspense, always resolves to exactly 5 cards
  //   B) Extras (becauseYouStudied, recommendedForLevel) — separate Suspense,
  //      placed after main sections so it extends below the fold rather than
  //      expanding the middle of the page
  const recommendedForYouFinalPromise = userId && learningProfilePromise
    ? trackRequestWork(
        ResourcesDiscoverRFYFinalSection({
          learningProfilePromise,
          recommendationVariant,
          ownedIds,
          ownedIdsPromise,
          globalFiltered,
          userId,
        }),
      )
    : null;
  const personalisedExtrasPromise = userId && learningProfilePromise
    ? trackRequestWork(
        ResourcesDiscoverPersonalisedExtras({
          learningProfilePromise,
          ownedIds,
          ownedIdsPromise,
          globalFiltered,
        }),
      )
    : null;

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
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={{
                  ...resource,
                  highlightBadge: index < 2 ? "Trending this week" : null,
                  socialProofLabel: index < 2 ? "Trending fast this week" : null,
                }}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
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

      {recommendedForYouFinalPromise ? (
        <Suspense fallback={<RecommendedForYouFallbackSection />}>
          <AwaitResolvedNode promise={recommendedForYouFinalPromise} />
        </Suspense>
      ) : globalFiltered.slice(0, 5).length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Popular right now"
            description="Top resources other learners are exploring this week."
            viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {globalFiltered.slice(0, 5).map((resource) => (
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={resource}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
              />
            ))}
          </div>
        </section>
      ) : null}

      {discoverData.newReleases.length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="New releases"
            description="Fresh additions from creators and educators, surfaced with the newest material first."
            viewAllHref={routes.marketplaceQuery("sort=newest&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(discoverData.newReleases as ResourceCardData[]).map((resource) => (
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={resource}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
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
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={resource}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
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
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={resource}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
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
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={{
                  ...resource,
                  highlightBadge: index < 2 ? "Popular right now" : null,
                  socialProofLabel: index < 2 ? "High demand right now" : null,
                }}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Extra personalised sections (becauseYouStudied, recommendedForLevel) appear
          below the fold — they extend the page rather than disrupting the main layout */}
      {personalisedExtrasPromise ? (
        <Suspense fallback={null}>
          <AwaitResolvedNode promise={personalisedExtrasPromise} />
        </Suspense>
      ) : null}

      <CreatorCTA />
      {BLOG_SECTION_ENABLED ? <BlogSection /> : null}
      <EmailSignup />
    </div>
  );
}

// ResourcesDiscoverPersonalisedSection removed — replaced by
// ResourcesDiscoverRFYFinalSection + ResourcesDiscoverPersonalisedExtras below.

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

async function loadOwnedIdsSafe(userId?: string) {
  if (!userId) {
    return new Set<string>();
  }

  try {
    return await traceServerStep(
      "resources.getOwnedResourceIds",
      () => getOwnedResourceIds(userId),
      { personalized: true },
    );
  } catch (error) {
    if (
      !isMissingTableError(error) &&
      !isDiscoverPersonalizationTransientError(error)
    ) {
      throw error;
    }

    return new Set<string>();
  }
}

async function loadLearningProfileSafe(userId?: string) {
  if (!userId) {
    return null;
  }

  try {
    return await traceServerStep(
      "resources.getUserLearningProfile",
      () => getUserLearningProfile(userId),
      { personalized: true },
    );
  } catch (error) {
    if (
      !isMissingTableError(error) &&
      !isDiscoverPersonalizationTransientError(error)
    ) {
      throw error;
    }

    return null;
  }
}

function isDiscoverPersonalizationTransientError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Timed out fetching a new connection from the connection pool") ||
    message.includes("Can't reach database server") ||
    message.includes("Error in PostgreSQL connection") ||
    message.includes("kind: Closed")
  );
}

function buildResultsContext(
  total: number,
  activeCategoryName: string,
  category: string | undefined,
  search: string | undefined,
  price: string,
  formatNum: (n: number) => string,
): string | null {
  if (total === 0) return null;

  const n = total === 1 ? "1 resource" : `${formatNum(total)} resources`;
  const inAll = "across all categories";
  const inCat = `in ${activeCategoryName}`;
  const scope = category === "all" ? inAll : inCat;
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
    <div className="flex flex-col gap-3 border-b border-surface-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
        <LoadingSkeleton className="h-2 w-2 rounded-full bg-primary-500" />
        <span>Preparing filters</span>
      </div>
      <div className="flex gap-2">
        <LoadingSkeleton className="h-11 w-28 rounded-full border border-surface-200 bg-surface-50" />
        <LoadingSkeleton className="h-11 w-32 rounded-full border border-surface-200 bg-surface-50" />
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <div className="w-[252px] flex-shrink-0 space-y-5">
      <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
        <LoadingSkeleton className="h-2 w-2 rounded-full bg-primary-500" />
        <span>Loading filters</span>
      </div>
      {[80, 120, 80].map((height, index) => (
        <LoadingSkeleton
          key={index}
          className="rounded-2xl border border-surface-200 bg-surface-50/70"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function DiscoverSectionsFallback() {
  return (
    <div className="space-y-16 lg:space-y-20">
      <DeferredSectionFallback titleWidth="w-32" cardCount={4} />
      <DeferredSectionFallback titleWidth="w-40" cardCount={4} />
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

// ── Recommended for you — single-Suspense path ────────────────────────────────
//
// Resolves to EXACTLY 5 cards in all cases:
//   • No history → returns the same 5 globalFiltered cards as the fallback
//     (swap is invisible — same data, same structure)
//   • Has history + recs found → returns 5 personalized cards
//   • Has history + no recs → falls back to 5 globalFiltered cards
//
// This eliminates the double-swap: the old chain resolved to extra sections +
// an inner Suspense, causing two visible DOM replacements and layout growth.

async function ResourcesDiscoverRFYFinalSection({
  learningProfilePromise,
  recommendationVariant,
  ownedIds,
  ownedIdsPromise,
  globalFiltered,
  userId,
}: {
  learningProfilePromise: Promise<Awaited<ReturnType<typeof getUserLearningProfile>> | null>;
  recommendationVariant: RecommendationVariant | null;
  ownedIds: Set<string>;
  ownedIdsPromise: Promise<Set<string>> | null;
  globalFiltered: ResourceCardData[];
  userId: string;
}) {
  const fallbackCards = globalFiltered.slice(0, 5);
  const learningProfile = await learningProfilePromise;

  // No purchase history — resolve to same 5 cards as fallback (invisible swap)
  if (!learningProfile?.hasHistory) {
    if (fallbackCards.length === 0) return null;
    return (
      <section className="space-y-5">
        <SectionHeader
          title="Recommended for you"
          description="A focused set of picks to help you keep momentum without sorting through the whole library."
          viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
        />
        <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {fallbackCards.map((resource, index) => (
            <ResourceCardWithDeferredOwnedBadge
              key={resource.id}
              resource={resource}
              variant="marketplace"
              ownedIdsPromise={ownedIdsPromise}
              priority={index < 2}
              linkPrefetchMode="intent"
            />
          ))}
        </div>
      </section>
    );
  }

  const topCategoryIds = learningProfile.topCategories.map((item) => item.id);
  const recommendedForYou = (await (
    recommendationVariant === "phase1"
      ? getPhase1Recommendations(topCategoryIds, ownedIds, globalFiltered, 5)
      : getBehaviorBasedRecommendations(userId, ownedIds, topCategoryIds, globalFiltered, 5)
  )) as ResourceCardData[];

  // Fire analytics impression events (non-blocking)
  if (recommendationVariant && recommendedForYou.length > 0) {
    void recordAnalyticsEvents(
      recommendedForYou.map((resource, position) => ({
        eventType: "RESOURCE_VIEW" as const,
        userId,
        resourceId: resource.id,
        metadata: {
          source: "recommendation_impression",
          experiment: RECOMMENDATION_EXPERIMENT_ID,
          variant: recommendationVariant,
          section: "recommended_for_you",
          position,
        },
      })),
    ).catch(() => undefined);
  }

  // Personalized if available, fallback otherwise — always exactly 5 cards
  const finalCards = (recommendedForYou.length > 0 ? recommendedForYou : globalFiltered).slice(0, 5);
  if (finalCards.length === 0) return null;

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Recommended for you"
        description="A focused set of picks to help you keep momentum without sorting through the whole library."
        viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
      />
      <RecommendationSection
        variant={recommendationVariant}
        section="recommended_for_you"
      >
        <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {finalCards.map((resource, index) => (
            <div key={resource.id} data-resource-id={resource.id}>
              <ResourceCardWithDeferredOwnedBadge
                resource={resource}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                priority={index < 2}
                linkPrefetchMode="intent"
              />
            </div>
          ))}
        </div>
      </RecommendationSection>
    </section>
  );
}

// ── Personalised extras — separate Suspense, placed after main sections ────────
//
// Because you studied + Recommended for your level.
// Rendered below the fold (after mostDownloaded), so their late arrival
// extends the page downward rather than shifting content in the visible area.

async function ResourcesDiscoverPersonalisedExtras({
  learningProfilePromise,
  ownedIds,
  ownedIdsPromise,
  globalFiltered,
}: {
  learningProfilePromise: Promise<Awaited<ReturnType<typeof getUserLearningProfile>> | null>;
  ownedIds: Set<string>;
  ownedIdsPromise: Promise<Set<string>> | null;
  globalFiltered: ResourceCardData[];
}) {
  const learningProfile = await learningProfilePromise;

  if (!learningProfile?.hasHistory) {
    return null;
  }

  const recentCategoryId = learningProfile.recentCategoryId ?? null;
  const personalizedLevelIds = learningProfile.preferredLevels;
  const recentStudyTitle = learningProfile.recentStudyTitle ?? null;
  const recentCategoryName = learningProfile.recentCategoryName ?? null;

  const becauseYouStudiedPromise = recentCategoryId
    ? getCachedNewResourcesInCategories([recentCategoryId], 8).then((resources) =>
        resources.filter((resource) => !ownedIds.has(resource.id)).slice(0, 5),
      )
    : Promise.resolve([] as ResourceCardData[]);
  const recommendedForLevelPromise = personalizedLevelIds.length > 0
    ? getCachedRecommendedResourcesByLevels(personalizedLevelIds, 6).then((resources) =>
        resources.filter((resource) => !ownedIds.has(resource.id)).slice(0, 4),
      )
    : Promise.resolve([] as ResourceCardData[]);

  const [becauseYouStudied, recommendedForLevel] = await Promise.all([
    becauseYouStudiedPromise,
    recommendedForLevelPromise,
  ]);

  if (
    !((becauseYouStudied as ResourceCardData[]).length > 0 && recentStudyTitle && recentCategoryName) &&
    !((recommendedForLevel as ResourceCardData[]).length > 0 && personalizedLevelIds.length > 0)
  ) {
    return null;
  }

  return (
    <>
      {(becauseYouStudied as ResourceCardData[]).length > 0 && recentStudyTitle && recentCategoryName ? (
        <section className="space-y-5">
          <SectionHeader
            title={`Because you studied ${recentStudyTitle}`}
            description={`More resources in ${recentCategoryName} you haven't tried yet.`}
            viewAllHref={routes.marketplaceQuery("category=all&sort=newest")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {(becauseYouStudied as ResourceCardData[]).map((resource) => (
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={{
                  ...resource,
                  socialProofLabel: `More in ${recentCategoryName}`,
                }}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
              />
            ))}
          </div>
        </section>
      ) : null}

      {(recommendedForLevel as ResourceCardData[]).length > 0 && personalizedLevelIds.length > 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Recommended for your level"
            description="Deterministic picks shaped by the difficulty level your recent purchases suggest."
            viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
          />
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {(recommendedForLevel as ResourceCardData[]).map((resource) => (
              <ResourceCardWithDeferredOwnedBadge
                key={resource.id}
                resource={{
                  ...resource,
                  socialProofLabel: "Recommended for your current pace",
                }}
                variant="marketplace"
                ownedIdsPromise={ownedIdsPromise}
                linkPrefetchMode="intent"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function RecommendedForYouFallbackSection() {
  return (
    <section className="space-y-5">
      <SectionHeader
        title="Recommended for you"
        description="A focused set of picks to help you keep momentum without sorting through the whole library."
        viewAllHref={routes.marketplaceQuery("sort=trending&category=all")}
      />
      <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: 5 }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
