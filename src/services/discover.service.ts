/**
 * Discover Service
 *
 * Owns every query the Discover home page needs.
 * Using Prisma `select` (via RESOURCE_CARD_SELECT) instead of `include` so
 * Postgres never sends columns the card UI doesn't render.
 *
 * This is the canonical discover data layer.  The page component should
 * import from here and contain no database logic of its own.
 */

import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { calculateTrendingScore } from "@/analytics/aggregation.service";
import {
  CACHE_KEYS,
  CACHE_TTLS,
  rememberJson,
  runSingleFlight,
} from "@/lib/cache";
import {
  logPerformanceEvent,
  recordCacheCall,
  recordCacheMiss,
  traceServerStep,
} from "@/lib/performance/observability";
import { attachResourceTrustSignals } from "@/services/review.service";
import { resolveHomepageHero } from "@/services/heroes/hero.resolver";
import {
  findDiscoverCategoriesWithCounts,
  findDiscoverFallbackResourceIds,
  findDiscoverResourcesByIds,
} from "@/repositories/resources/resource.repository";
import {
  findFeaturedResourceIds,
  findFreeResourceIds,
  findNewestResourceIds,
  findTopCreatorThisWeek,
  findTopDownloadedResourceIds,
  findTrendingResourceSignals,
  findTopTrendingResourceIds,
} from "@/repositories/analytics/analytics.repository";

const DAY_MS = 86_400_000;
const TRENDING_WINDOW_DAYS = 30;
const DISCOVER_DATA_SINGLE_FLIGHT_KEY = "discover-data:refresh";

function isDiscoverPoolPressureError(error: unknown) {
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

async function resolveDiscoverFallbackIds(
  existingIds: string[],
  limit: number,
  orderBy: Prisma.ResourceFindManyArgs["orderBy"],
  where?: Prisma.ResourceFindManyArgs["where"],
) {
  if (existingIds.length > 0) {
    return existingIds;
  }

  try {
    return await findDiscoverFallbackResourceIds(limit, orderBy, where);
  } catch (error) {
    throw error;
  }
}

async function getDiscoverSectionIds(options: {
  cacheKey: string;
  limit: number;
  metricName: string;
  primaryLoader: () => Promise<string[]>;
  fallbackOrderBy: Prisma.ResourceFindManyArgs["orderBy"];
  fallbackWhere?: Prisma.ResourceFindManyArgs["where"];
}) {
  const {
    cacheKey,
    limit,
    metricName,
    primaryLoader,
    fallbackOrderBy,
    fallbackWhere,
  } = options;

  return rememberJson<string[]>(
    `${cacheKey}:${limit}`,
    CACHE_TTLS.homepageList,
    async () => {
      let ids: string[] = [];

      try {
        ids = await primaryLoader();
      } catch (error) {
        if (!isDiscoverPoolPressureError(error)) {
          throw error;
        }
      }

      return resolveDiscoverFallbackIds(
        ids,
        limit,
        fallbackOrderBy,
        fallbackWhere,
      );
    },
    {
      metricName,
      details: { limit },
    },
  );
}

async function getTopCreatorForDiscover() {
  return rememberJson(
    CACHE_KEYS.topCreator,
    CACHE_TTLS.homepageList,
    () => findTopCreatorThisWeek(),
    { metricName: "discover.topCreator" },
  );
}

// ── Preview normaliser ────────────────────────────────────────────────────────

/**
 * Promotes `previews[0].imageUrl` into a top-level `previewUrl` field so that
 * card components can read a single consistent property regardless of whether
 * the result came from the `previewUrl` DB column or the `previews` relation.
 *
 * When `RESOURCE_CARD_SELECT` is used (column not selected), `r.previewUrl` is
 * absent — the chain falls back to the relation value automatically.
 * When older `include`-based queries return the column, it takes priority.
 */
export function withPreview<
  T extends { previewUrl?: string | null; previews?: { imageUrl: string }[] }
>(r: T): T & { previewUrl: string | null } {
  return {
    ...r,
    previewUrl: r.previewUrl ?? r.previews?.[0]?.imageUrl ?? null,
  };
}

async function getTrendingResourceIds(limit = 8) {
  return rememberJson<string[]>(
    `${CACHE_KEYS.trendingResources}:${limit}`,
    CACHE_TTLS.homepageList,
    async () => {
      return traceServerStep(
        "discover.getTrendingResourceIds",
        async () => {
          const since = new Date(Date.now() - DAY_MS * TRENDING_WINDOW_DAYS);
          let candidates: Awaited<ReturnType<typeof findTrendingResourceSignals>> = [];

          try {
            candidates = await traceServerStep(
              "discover.findTrendingResourceSignals",
              () => findTrendingResourceSignals(since, Math.max(limit * 4, 24)),
              { candidateLimit: Math.max(limit * 4, 24) },
            );
          } catch (error) {
            if (!isDiscoverPoolPressureError(error)) {
              throw error;
            }
          }

          if (candidates.length === 0) {
            return traceServerStep(
              "discover.findTopTrendingResourceIdsFallback",
              () => findTopTrendingResourceIds(limit),
              { limit },
            );
          }

          return candidates
            .map((candidate) => ({
              resourceId: candidate.resourceId,
              trendScore: calculateTrendingScore({
                recentDownloads: candidate.recentDownloads,
                recentSales: candidate.recentSales,
                recentRevenue: candidate.recentRevenue,
                averageRating: candidate.averageRating,
                reviewCount: candidate.reviewCount,
                ageInDays: Math.max(
                  0,
                  (Date.now() - candidate.publishedAt.getTime()) / DAY_MS,
                ),
              }),
            }))
            .sort((left, right) => right.trendScore - left.trendScore)
            .slice(0, limit)
            .map((row) => row.resourceId);
        },
        { limit },
      );
    },
    {
      metricName: "discover.trendingResourceIds",
      details: { limit },
    },
  );
}

export async function getTrendingResources(limit = 8) {
  const rankedIds = await getTrendingResourceIds(limit);
  const pool = await loadDiscoverResourcesByIds(rankedIds);

  return rankedIds
    .map((id) => pool.get(id))
    .filter((resource): resource is NonNullable<typeof resource> => Boolean(resource))
    .map(withPreview);
}

// ── Discover sections ─────────────────────────────────────────────────────────

/**
 * Fetches and returns the six curated sections shown on the Discover home.
 *
 * Wrapped with `unstable_cache` so the six parallel Prisma queries only hit
 * the database once every CACHE_TTLS.homepageList seconds across all
 * concurrent requests.
 * Immediately invalidated via `revalidateTag("discover")` whenever an admin
 * creates, updates, or archives a resource.
 *
 * The function has no request-scoped dependencies (no session, no params),
 * which is what makes the `unstable_cache` wrapper safe and effective.
 */
const readDiscoverData = unstable_cache(
  async function _getDiscoverData() {
    recordCacheMiss("getDiscoverData");
    logPerformanceEvent("cache_execute:getDiscoverData");
    return runSingleFlight(DISCOVER_DATA_SINGLE_FLIGHT_KEY, async () => {
      const [
        trendingIds,
        popularIds,
        newestIds,
        featuredIds,
        freeIds,
        topCreator,
      ] = await traceServerStep(
        "discover.loadSectionSources",
        () =>
          Promise.all([
            getTrendingResourceIds(8),
            getDiscoverSectionIds({
              cacheKey: CACHE_KEYS.popularResources,
              limit: 8,
              metricName: "discover.popularResources",
              primaryLoader: () => findTopDownloadedResourceIds(8),
              fallbackOrderBy: [
                { downloadCount: "desc" },
                { createdAt: "desc" },
              ],
            }),
            getDiscoverSectionIds({
              cacheKey: CACHE_KEYS.newestResources,
              limit: 8,
              metricName: "discover.newestResources",
              primaryLoader: () => findNewestResourceIds(8),
              fallbackOrderBy: { createdAt: "desc" },
            }),
            getDiscoverSectionIds({
              cacheKey: CACHE_KEYS.featuredResources,
              limit: 8,
              metricName: "discover.featuredResources",
              primaryLoader: () => findFeaturedResourceIds(8),
              fallbackOrderBy: [
                { downloadCount: "desc" },
                { createdAt: "desc" },
              ],
              fallbackWhere: { featured: true },
            }),
            getDiscoverSectionIds({
              cacheKey: CACHE_KEYS.freeResources,
              limit: 8,
              metricName: "discover.freeResources",
              primaryLoader: () => findFreeResourceIds(8),
              fallbackOrderBy: [
                { downloadCount: "desc" },
                { createdAt: "desc" },
              ],
              fallbackWhere: { isFree: true },
            }),
            getTopCreatorForDiscover(),
          ]),
        { sectionLimit: 8 },
      );

      const resourceIds = Array.from(
        new Set([
          ...trendingIds,
          ...popularIds,
          ...newestIds,
          ...featuredIds,
          ...freeIds,
        ]),
      );

      const pool = await traceServerStep(
        "discover.loadSectionResourcePool",
        () => loadDiscoverResourcesByIds(resourceIds),
        { resourceCount: resourceIds.length },
      );

      const mapSection = (ids: string[]) =>
        ids
          .map((id) => pool.get(id))
          .filter((resource): resource is NonNullable<typeof resource> =>
            Boolean(resource),
          )
          .map(withPreview);

      const trendingResources = mapSection(trendingIds);
      const trending = trendingResources.slice(0, 5);
      const newReleases = mapSection(newestIds).slice(0, 5);
      const featured = mapSection(featuredIds).slice(0, 5);
      const freeResources = mapSection(freeIds).slice(0, 5);
      const mostDownloaded = mapSection(popularIds).slice(0, 5);
      const recommended = trendingResources.slice(0, 8);

      return {
        trending,
        newReleases,
        featured,
        freeResources,
        mostDownloaded,
        recommended,
        topCreator,
      };
    });
  },
  ["discover-data"],
  { revalidate: CACHE_TTLS.homepageList, tags: ["discover"] }
);

export async function getDiscoverData() {
  recordCacheCall("getDiscoverData");
  return readDiscoverData();
}

async function loadDiscoverResourcesByIds(resourceIds: string[]) {
  const rows = await traceServerStep(
    "discover.findDiscoverResourcesByIds",
    () => findDiscoverResourcesByIds(resourceIds),
    { resourceCount: resourceIds.length },
  );

  const resources = await traceServerStep(
    "discover.attachResourceTrustSignals",
    () => attachResourceTrustSignals(rows),
    { resourceCount: rows.length },
  );

  return new Map(resources.map((row) => [row.id, row]));
}

// ── Convenience type ──────────────────────────────────────────────────────────

export type DiscoverData = Awaited<ReturnType<typeof getDiscoverData>>;

// ── Supporting queries ────────────────────────────────────────────────────────

/**
 * Returns categories with their published-resource counts for the
 * "Browse by category" grid.
 *
 * Wrapped in its own unstable_cache entry (same "discover" tag) so that
 * callers outside of getDiscoverData — e.g. the marketplace page — never
 * incur an extra DB round-trip when the discover cache is warm.
 */
const readDiscoverCategories = unstable_cache(
  async function _getDiscoverCategories() {
    recordCacheMiss("getDiscoverCategories");
    return findDiscoverCategoriesWithCounts();
  },
  ["discover-categories"],
  { revalidate: CACHE_TTLS.homepageList, tags: ["discover"] }
);

export async function getDiscoverCategories() {
  recordCacheCall("getDiscoverCategories");
  return readDiscoverCategories();
}

/**
 * Returns the hero config used in discover mode.
 * Falls back to HomepageHero when no active CMS hero exists.
 */
export async function getHeroConfig(context?: { userId?: string | null }) {
  return resolveHomepageHero(context);
}
