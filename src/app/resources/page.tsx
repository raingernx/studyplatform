import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Languages,
  LayoutGrid,
  Palette,
} from "lucide-react";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isMissingTableError } from "@/lib/prismaErrors";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceCard, type ResourceCardData } from "@/components/resources/ResourceCard";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { HeroBanner } from "@/components/marketplace/HeroBanner";
import { DiscoverButton, CategoryChips, type ChipCategory } from "@/components/marketplace/CategoryChips";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { FilterSidebar, type FilterCategory } from "@/components/marketplace/FilterSidebar";
import { MobileFilterDialog } from "@/components/marketplace/MobileFilterDialog";
import { CreatorCTA } from "@/components/discover/CreatorCTA";
import { BlogSection } from "@/components/discover/BlogSection";
import { EmailSignup } from "@/components/discover/EmailSignup";
import { formatNumber, formatPrice } from "@/lib/format";

// ── Service imports ───────────────────────────────────────────────────────────

import {
  getDiscoverData,
  getDiscoverCategories,
  getHeroConfig,
  type DiscoverData,
} from "@/services/discover.service";
import { getMarketplaceResources } from "@/services/resource.service";
import { cookies } from "next/headers";
import { normaliseSortParam, SORT_OPTIONS } from "@/config/sortOptions";
import {
  RANKING_EXPERIMENT_COOKIE,
  isValidRankingVariant,
  variantToSort,
} from "@/lib/ranking-experiment";
import { getOwnedResourceIds, getUserLearningProfile } from "@/services/purchase.service";
import {
  getCachedNewResourcesInCategories,
  getCachedRecommendedResourcesByLevels,
} from "@/services/resources/resource.service";
import { getBehaviorBasedRecommendations, getPhase1Recommendations } from "@/services/recommendations/behavior-profile.service";
import { assignRecommendationVariant, RECOMMENDATION_EXPERIMENT_ID } from "@/lib/recommendations/experiment";
import { RecommendationSection } from "@/components/recommendations/RecommendationSection";
import { recordAnalyticsEvents } from "@/analytics/event.service";

// force-dynamic removed: the page already opts into per-request dynamic rendering
// naturally via two request-scoped reads:
//   - await cookies()          → reads the ranking-experiment assignment cookie
//   - await getServerSession() → reads the session JWT from request cookies
// Both of these make the page inherently dynamic on every request regardless of
// this annotation. The explicit force-dynamic was redundant and prevented Next.js
// from applying any route-level optimizations (streaming, partial cache, etc.).
// Pages that genuinely need the annotation (dashboard, admin) keep their own.

export const metadata = {
  title: "Discover Study Resources",
  description: "Browse and download study resources.",
};

// ── Config ────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

// ── Page ──────────────────────────────────────────────────────────────────────

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
  const sort = normaliseSortParam(getSearchParamValue(rawSort));
  const pageParam = getSearchParamValue(rawPage)?.trim();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Discover = no category selected; Category = any category (including "all")
  const isDiscoverMode = !category;

  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    // Auth tables missing in local dev — treat as unauthenticated.
  }
  const userId  = session?.user?.id;

  // ── Ranking experiment: override sort based on assigned variant ─────────────
  //
  // Variant A (control)  → sort = "newest"
  // Variant B (treatment) → sort = "recommended"
  //
  // The cookie is set by middleware on first page visit. On the rare first
  // request where the cookie is not yet present (race between middleware set
  // and this read), `variantToSort` safely falls back to "newest".
  //
  // This override applies to the listing/search view only (isDiscoverMode=false).
  // The discover-mode homepage uses a separate curated data pipeline that is
  // not affected by this experiment.
  let effectiveSort: string = sort;
  try {
    const cookieStore = await cookies();
    const rawVariant = cookieStore.get(RANKING_EXPERIMENT_COOKIE)?.value;
    effectiveSort = variantToSort(isValidRankingVariant(rawVariant) ? rawVariant : null);
  } catch {
    // Cookie read failure must never disrupt the page. Fall back to "newest".
    effectiveSort = "newest";
  }

  // ── Mode-specific data ──────────────────────────────────────────────────────

  let categories: { id: string; name: string; slug: string }[] = [];
  let discoverCategoriesWithCount: { id: string; name: string; slug: string; _count: { resources: number } }[] = [];
  let resources: ResourceCardData[] = [];
  let total      = 0;
  let totalPages = 1;
  let safePage   = 1;
  let discoverData: DiscoverData | null = null;
  let heroConfig: Awaited<ReturnType<typeof getHeroConfig>> = null;
  let learningProfile: Awaited<ReturnType<typeof getUserLearningProfile>> | null = null;

  if (isDiscoverMode) {
    try {
      const [heroResult, categoriesWithCount, data] = await Promise.all([
        getHeroConfig({ userId }),
        getDiscoverCategories(),
        getDiscoverData(),
      ]);
      heroConfig     = heroResult;
      categories     = categoriesWithCount.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
      discoverData   = data;
      discoverCategoriesWithCount = categoriesWithCount;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
      // DB schema missing in local dev — render with empty discover data.
    }
  } else {
    try {
      const data = await getMarketplaceResources({
        search,
        category,
        price,
        featured: featured === "true",
        tag,
        sort: effectiveSort,
        page:     currentPage,
        pageSize: ITEMS_PER_PAGE,
      });
      resources   = data.resources as ResourceCardData[];
      total       = data.total;
      categories  = data.categories;
      totalPages  = data.totalPages;
      safePage    = Math.min(currentPage, totalPages);
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
      // DB schema missing in local dev — render empty marketplace.
    }
    discoverCategoriesWithCount = [];
  }

  // ── Owned IDs + learning profile (both independent reads, run in parallel) ──

  let ownedIds = new Set<string>();
  const [ownedIdsResult, learningProfileResult] = await Promise.allSettled([
    userId ? getOwnedResourceIds(userId) : Promise.resolve(new Set<string>()),
    isDiscoverMode && userId
      ? getUserLearningProfile(userId)
      : Promise.resolve(null),
  ]);

  if (ownedIdsResult.status === "fulfilled") {
    ownedIds = ownedIdsResult.value;
  } else if (!isMissingTableError(ownedIdsResult.reason)) {
    throw ownedIdsResult.reason;
  }

  if (learningProfileResult.status === "fulfilled") {
    learningProfile = learningProfileResult.value;
  } else if (!isMissingTableError(learningProfileResult.reason)) {
    throw learningProfileResult.reason;
  }
  // Category of the most recently purchased resource — used for the "Because you studied X"
  // section so the title and the card results actually agree on the same subject.
  // Distinct from personalizedCategoryIds (all top categories) which is only used for levels.
  const recentCategoryId = learningProfile?.recentCategoryId ?? null;
  const personalizedLevelIds = learningProfile?.preferredLevels ?? [];
  const topCategoryIds = learningProfile?.topCategories.map((c) => c.id) ?? [];

  // Global trending (owned already excluded at render time; Phase 2 uses this
  // as a final fallback when the behavior profile is empty or too weak).
  const globalFiltered = isDiscoverMode
    ? (discoverData?.recommended as ResourceCardData[] ?? []).filter((r) => !ownedIds.has(r.id))
    : [];

  // A/B experiment: stable 50/50 split per authenticated user.
  // Guests always see the generic global feed (no variant assigned).
  const recommendationVariant = userId ? assignRecommendationVariant(userId) : null;

  // ── Personalised recommendation sections ──────────────────────────────────
  //
  // "Because you studied X" and "Recommended for your level" use cached base
  // queries (no per-user NOT IN clause in SQL) so results are shared across
  // all users with the same category/level preferences.  Owned exclusion is
  // applied in memory after the cache hit using the freshly-fetched ownedIds.
  // This removes two per-request DB queries from the critical path for
  // authenticated discover-mode users who have purchase history.
  const [becauseYouStudied, recommendedForLevel, recommendedForYou] =
    isDiscoverMode && userId && learningProfile?.hasHistory
      ? await Promise.all([
          recentCategoryId
            ? getCachedNewResourcesInCategories([recentCategoryId], 8)
                .then((rs) => rs.filter((r) => !ownedIds.has(r.id)).slice(0, 5))
            : Promise.resolve([]),
          personalizedLevelIds.length > 0
            ? getCachedRecommendedResourcesByLevels(personalizedLevelIds, 6)
                .then((rs) => rs.filter((r) => !ownedIds.has(r.id)).slice(0, 4))
            : Promise.resolve([]),
          // Variant A → Phase 1 (category-trending control arm)
          // Variant B → Phase 2 (behavior-based treatment arm)
          recommendationVariant === "phase1"
            ? getPhase1Recommendations(topCategoryIds, ownedIds, globalFiltered, 5)
            : getBehaviorBasedRecommendations(
                userId,
                ownedIds,
                topCategoryIds,
                globalFiltered,
                5,
              ),
        ])
      : [[], [], globalFiltered.slice(0, 5) as ResourceCardData[]];

  // Record recommendation impressions (fire-and-forget, non-blocking).
  // One RESOURCE_VIEW event per shown resource, tagged with experiment context,
  // so per-resource and per-variant CTR can be queried from analytics_events.
  if (userId && recommendationVariant && (recommendedForYou as ResourceCardData[]).length > 0) {
    void recordAnalyticsEvents(
      (recommendedForYou as ResourceCardData[]).map((r, position) => ({
        eventType:  "RESOURCE_VIEW" as const,
        userId,
        resourceId: r.id,
        metadata: {
          source:     "recommendation_impression",
          experiment: RECOMMENDATION_EXPERIMENT_ID,
          variant:    recommendationVariant,
          section:    "recommended_for_you",
          position,
        },
      })),
    ).catch(() => undefined);
  }
  const discoverResourceCount = discoverCategoriesWithCount.reduce(
    (sum, item) => sum + item._count.resources,
    0,
  );
  const activeCategoryName =
    category === "all"
      ? "All categories"
      : categories.find((item) => item.slug === category)?.name ?? "Browse resources";
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest";
  const hasActiveFilters = !!(search?.trim() || price !== "" || sort !== "newest" || tag || featured === "true");
  const resultsContext = buildResultsContext(total, activeCategoryName, category, search, price, formatNumber);
  // Only spotlight resources that have an actual image — a hero card with no
  // thumbnail looks empty and actively undermines the "top pick" framing.
  // withPreview maps previews[0].imageUrl → previewUrl, so that's the check.
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">

        {/* ── Announcement bar + Hero (discover only) ─────────────────── */}
        {isDiscoverMode && (
          <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="mx-auto max-w-[1600px] space-y-4">

              {/* Announcement bar */}
              <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-surface-200 bg-surface-50 px-5 py-2.5 text-center">
                <span
                  className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium text-text-secondary">
                  New: Discover top-rated study resources curated by educators.{" "}
                  <span className="font-semibold text-text-primary">
                    Explore the library →
                  </span>
                </p>
              </div>

              {/* Hero banner */}
              <HeroBanner config={heroConfig} />

            </div>
          </section>
        )}

        <Container className="space-y-12 sm:space-y-14 lg:space-y-16 py-12 sm:py-14 lg:py-16">
          <>

          {/* ── Category nav + Search (always visible) ────────────────────── */}
          <section className="rounded-[32px] border border-surface-200 bg-white/90 p-4 shadow-card sm:p-5 lg:p-6">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {isDiscoverMode ? "Discover" : "Browse"}
                  </p>
                  <h1 className="max-w-3xl font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                    {isDiscoverMode
                      ? "A calmer way to discover standout study resources"
                      : `Explore ${activeCategoryName}`}
                  </h1>
                  {isDiscoverMode && (
                    <p className="max-w-2xl text-sm leading-6 text-text-secondary">
                      Browse curated collections, trending picks, and new releases from educators and creators in one focused library.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-[12px] font-medium text-text-secondary">
                    {isDiscoverMode
                      ? `${formatNumber(discoverCategoriesWithCount.length)} categories`
                      : `${formatNumber(total)} results`}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-[12px] font-medium text-text-secondary">
                    {isDiscoverMode
                      ? `${formatNumber(discoverResourceCount)} resources`
                      : `Sorted by: ${sortLabel}`}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-surface-200 via-surface-100 to-transparent" aria-hidden />

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden sm:gap-4">
                  <Suspense fallback={<DiscoverFallback />}>
                    <DiscoverButton />
                  </Suspense>
                  <div className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />
                  <ScrollableCategoryNav>
                    <Suspense fallback={<ChipsFallback />}>
                      <CategoryChips categories={categories as ChipCategory[]} />
                    </Suspense>
                  </ScrollableCategoryNav>
                </div>

                <div className="w-full shrink-0 lg:max-w-lg">
                  <Suspense fallback={<SearchFallback />}>
                    <HeroSearch />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* DISCOVER MODE — curated sections, no sidebar                    */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className={isDiscoverMode ? "space-y-16 lg:space-y-20" : undefined}>
            {isDiscoverMode && discoverData && (
              <>

              {/* Browse by category */}
              {discoverCategoriesWithCount.length > 0 && (
                <section className="space-y-6">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                      Browse by category
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-text-secondary">
                      Jump straight into curated collections with the clearest entry point for each subject area.
                    </p>
                  </div>
                  <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {discoverCategoriesWithCount.map((cat) => {
                      const Icon  = getCategoryIcon(cat.slug);
                      const color = getCategoryColor(cat.slug);
                      return (
                        <Link
                          key={cat.id}
                          href={`/resources?category=${encodeURIComponent(cat.slug)}`}
                          className="group block rounded-[24px] border border-surface-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-surface-300 hover:shadow-card-lg"
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color.bg} ${color.text}`}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-zinc-900 transition-colors group-hover:text-brand-700">{cat.name}</span>
                              <span className="mt-1 block text-[13px] text-zinc-500">
                                {formatNumber(cat._count.resources)} resources
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Trending now */}
              {discoverData.trending.length > 0 && (
                <section className="space-y-5">
                  <SectionHeader
                    title="Trending now"
                    description="Ranked by recent sales momentum, recent revenue, rating quality, and review volume to surface the strongest current picks."
                    viewAllHref="/resources?sort=trending&category=all"
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {(discoverData.trending as ResourceCardData[]).map((resource, index) => (
                      <ResourceCard
                        key={resource.id}
                        resource={{
                          ...resource,
                          highlightBadge: index < 2 ? "Trending this week" : null,
                          socialProofLabel: index < 2 ? "Trending fast this week" : null,
                        }}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {discoverData.topCreator?.creator.creatorSlug && (
                <section className="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-5 shadow-card">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
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
                    <Link
                      href={`/creators/${discoverData.topCreator.creator.creatorSlug}`}
                      className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 lg:self-auto"
                    >
                      Explore creator
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </section>
              )}

              {/* Because you studied X — only shown when user has real purchase history in a specific category */}
              {becauseYouStudied.length > 0 && learningProfile?.recentStudyTitle && learningProfile?.recentCategoryName && (
                <section className="space-y-5">
                  <SectionHeader
                    title={`Because you studied ${learningProfile.recentStudyTitle}`}
                    description={`More resources in ${learningProfile.recentCategoryName} you haven't tried yet.`}
                    viewAllHref={`/resources?category=all&sort=newest`}
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {(becauseYouStudied as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={{
                          ...resource,
                          socialProofLabel: `More in ${learningProfile.recentCategoryName}`,
                        }}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {recommendedForLevel.length > 0 && (learningProfile?.preferredLevels?.length ?? 0) > 0 && (
                <section className="space-y-5">
                  <SectionHeader
                    title="Recommended for your level"
                    description="Deterministic picks shaped by the difficulty level your recent purchases suggest."
                    viewAllHref="/resources?sort=trending&category=all"
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                    {(recommendedForLevel as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={{
                          ...resource,
                          socialProofLabel: "Recommended for your current pace",
                        }}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {recommendedForYou.length > 0 && (
                <section className="space-y-5">
                  <SectionHeader
                    title={learningProfile?.hasHistory ? "Recommended for you" : "Popular right now"}
                    description={learningProfile?.hasHistory
                      ? "A focused set of picks to help you keep momentum without sorting through the whole library."
                      : "Top resources other learners are exploring this week."}
                    viewAllHref="/resources?sort=trending&category=all"
                  />
                  <RecommendationSection
                    variant={recommendationVariant}
                    section="recommended_for_you"
                  >
                    <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                      {(recommendedForYou as ResourceCardData[]).map((resource) => (
                        <div key={resource.id} data-resource-id={resource.id}>
                          <ResourceCard
                            resource={resource}
                            variant="marketplace"
                            owned={ownedIds.has(resource.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </RecommendationSection>
                </section>
              )}

              {/* New releases */}
              {discoverData.newReleases.length > 0 && (
                <section className="space-y-5">
                  <SectionHeader
                    title="New releases"
                    description="Fresh additions from creators and educators, surfaced with the newest material first."
                    viewAllHref="/resources?sort=newest&category=all"
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {(discoverData.newReleases as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Featured picks */}
              {discoverData.featured.length > 0 && (
                <section className="space-y-5">
                  <SectionHeader
                    title="Featured picks"
                    viewAllHref="/resources?sort=featured&category=all"
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {(discoverData.featured as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Free resources */}
              {discoverData.freeResources.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Free resources"
                    viewAllHref="/resources?price=free&category=all"
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {(discoverData.freeResources as ResourceCardData[]).map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Most downloaded */}
              {discoverData.mostDownloaded.length > 0 && (
                <section className="space-y-4">
                  <SectionHeader
                    title="Most downloaded"
                    viewAllHref="/resources?sort=downloads&category=all"
                  />
                  <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                    {(discoverData.mostDownloaded as ResourceCardData[]).map((resource, index) => (
                      <ResourceCard
                        key={resource.id}
                        resource={{
                          ...resource,
                          highlightBadge: index < 2 ? "Popular right now" : null,
                          socialProofLabel: index < 2 ? "High demand right now" : null,
                        }}
                        variant="marketplace"
                        owned={ownedIds.has(resource.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <CreatorCTA />
              <BlogSection />
              <EmailSignup />
              </>
            )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* CATEGORY MODE — filter sidebar + paginated grid                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
            {!isDiscoverMode && (
              <section className="rounded-[32px] border border-surface-200 bg-white/85 p-4 shadow-card sm:p-5 lg:p-6">
                <div className="space-y-6">
                  <div className="flex flex-col gap-2 border-b border-surface-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        Results
                      </p>
                      <h2 className="max-w-3xl font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                        {activeCategoryName}
                      </h2>
                      {resultsContext && (
                        <p className="text-sm leading-6 text-text-secondary">
                          {resultsContext}
                        </p>
                      )}
                    </div>
                    {totalPages > 1 && (
                      <p className="shrink-0 text-sm text-text-secondary">
                        Page {safePage} of {totalPages}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                  {/* Sidebar filters */}
                  <div className="hidden lg:block">
                    <Suspense fallback={<SidebarFallback />}>
                      <FilterSidebar categories={categories as FilterCategory[]} />
                    </Suspense>
                  </div>

                  {/* Sort bar + grid */}
                    <div className="min-w-0 flex-1 space-y-5">
                    <div className="lg:hidden">
                      <MobileFilterDialog categories={categories as FilterCategory[]} />
                    </div>

                    <Suspense fallback={<FilterBarFallback />}>
                      <FilterBar total={total} />
                    </Suspense>

                    {spotlightResource && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                              {spotlightLabel}
                            </p>
                            <p className="mt-1 text-sm text-zinc-600">
                              A strong starting point in {activeCategoryName.toLowerCase()} if you
                              want the clearest signal first.
                            </p>
                          </div>
                          <Link
                            href={`/resources/${spotlightResource.slug}`}
                            className="hidden items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 sm:inline-flex"
                          >
                            View resource
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <ResourceCard
                          resource={{
                            ...spotlightResource,
                            highlightBadge: spotlightLabel,
                          }}
                          variant="hero"
                          owned={ownedIds.has(spotlightResource.id)}
                        />
                      </div>
                    )}

                    {search?.trim() && (
                      <p className="text-sm text-zinc-500">
                        {total === 0 ? (
                          <>
                            No results for{" "}
                            <strong className="text-zinc-900">
                              &ldquo;{search.trim()}&rdquo;
                            </strong>
                            .
                          </>
                        ) : (
                          <>
                            Showing results for{" "}
                            <strong className="text-zinc-900">
                              &ldquo;{search.trim()}&rdquo;
                            </strong>
                          </>
                        )}
                      </p>
                    )}

                    <ResourceGrid
                      resources={rankedResources}
                      ownedIds={Array.from(ownedIds)}
                      total={total}
                      page={safePage}
                      totalPages={totalPages}
                      hasActiveFilters={hasActiveFilters}
                    />
                  </div>
                </div>
                </div>
              </section>
            )}
          </div>

          </>
        </Container>
      </main>
    </div>
  );
}

// ── Results context summary ────────────────────────────────────────────────────

/**
 * Returns a concise, human-readable summary of the current category-mode
 * results. Used in the results section sub-header so users always know
 * exactly what the grid represents without reading a generic instruction.
 *
 * Returns null when total is 0 — empty states are handled by ResourceGrid.
 */
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
  const inAll  = "across all categories";
  const inCat  = `in ${activeCategoryName}`;
  const scope  = category === "all" ? inAll : inCat;
  const term   = search?.trim();

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

// ── Category icon and color mapping ───────────────────────────────────────────

function getCategoryIcon(slug: string): typeof Calculator {
  const s = slug.toLowerCase();
  if (s.includes("math"))          return Calculator;
  if (s.includes("science"))       return FlaskConical;
  if (s.includes("humanities"))    return BookOpen;
  if (s.includes("language"))      return Languages;
  if (s.includes("art"))           return Palette;
  if (s.includes("early-learning"))return GraduationCap;
  if (s.includes("study-skills"))  return ClipboardList;
  if (s.includes("test-prep"))     return GraduationCap;
  return LayoutGrid;
}

function getCategoryColor(slug: string): { bg: string; text: string } {
  const s = slug.toLowerCase();
  if (s.includes("math"))          return { bg: "bg-blue-100",   text: "text-blue-600" };
  if (s.includes("science"))       return { bg: "bg-green-100",  text: "text-green-600" };
  if (s.includes("language"))      return { bg: "bg-orange-100", text: "text-orange-600" };
  if (s.includes("humanities"))    return { bg: "bg-purple-100", text: "text-purple-600" };
  if (s.includes("art"))           return { bg: "bg-pink-100",   text: "text-pink-600" };
  if (s.includes("early-learning"))return { bg: "bg-yellow-100", text: "text-yellow-600" };
  if (s.includes("study-skills"))  return { bg: "bg-indigo-100", text: "text-indigo-600" };
  if (s.includes("test-prep"))     return { bg: "bg-red-100",    text: "text-red-600" };
  return { bg: "bg-zinc-100", text: "text-zinc-600" };
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  viewAllHref,
}: {
  title:       string;
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
      <Link
        href={viewAllHref}
        className="group inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-[13px] font-medium text-brand-600 transition hover:bg-brand-50 hover:text-brand-700 sm:self-auto"
      >
        <span className="inline-flex items-center gap-1">
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  );
}

// ── Fallback skeletons ────────────────────────────────────────────────────────

function DiscoverFallback() {
  return (
    <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-100" />
  );
}

function SearchFallback() {
  return (
    <div className="h-11 w-full animate-pulse rounded-2xl border border-surface-200 bg-white shadow-sm" />
  );
}

function ChipsFallback() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[48, 64, 72, 56, 80, 60].map((w, i) => (
        <div
          key={i}
          className="h-8 shrink-0 animate-pulse rounded-full bg-surface-100"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

function FilterBarFallback() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-100" />
      <div className="flex gap-2">
        <div className="h-10 w-28 animate-pulse rounded-lg bg-surface-100" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-surface-100" />
      </div>
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <div className="w-[260px] flex-shrink-0 space-y-4">
      {[80, 120, 80, 60].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-surface-200 bg-white shadow-card"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
