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
import { runBestEffortAsync, runWithConcurrencyLimit } from "@/lib/async";
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
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2024" || error.code === "P1017";
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
    message.includes("Server has closed the connection") ||
    message.includes("Can't reach database server") ||
    message.includes("connection closed") ||
    message.includes("Error in PostgreSQL connection") ||
    message.includes("kind: Closed")
  );
}

function getEmptyDiscoverData() {
  return {
    trending: [],
    newReleases: [],
    featured: [],
    freeResources: [],
    mostDownloaded: [],
    recommended: [],
    topCreator: null,
  };
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

  return findDiscoverFallbackResourceIds(limit, orderBy, where);
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
    () =>
      runBestEffortAsync(() => findTopCreatorThisWeek(), {
        fallback: null,
        warningLabel: "[DISCOVER_TOP_CREATOR_BEST_EFFORT]",
      }),
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

type DiscoverSectionSources = {
  trendingIds: string[];
  popularIds: string[];
  newestIds: string[];
  featuredIds: string[];
  freeIds: string[];
  topCreator: Awaited<ReturnType<typeof getTopCreatorForDiscover>>;
};

/**
 * Fetches and returns the six curated sections shown on the Discover home.
 *
 * Wrapped with `unstable_cache` so the discover source queries only hit
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
    // No try/catch here. On pool pressure we throw so unstable_cache does NOT
    // store empty data. rememberJson serves the last-good result from Redis on
    // cold lambda instances. getDiscoverData() catches errors and returns an
    // uncached empty fallback for the current request only.
    return rememberJson(
      CACHE_KEYS.discoverData,
      CACHE_TTLS.homepageList,
      () => runSingleFlight(DISCOVER_DATA_SINGLE_FLIGHT_KEY, async () => {
        const {
          trendingIds,
          popularIds,
          newestIds,
          featuredIds,
          freeIds,
          topCreator,
        } = await traceServerStep(
          "discover.loadSectionSources",
          async () => {
            const sectionSourceEntries = await runWithConcurrencyLimit(
              [
                {
                  key: "trendingIds" as const,
                  load: () => getTrendingResourceIds(8),
                },
                {
                  key: "popularIds" as const,
                  load: () =>
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
                },
                {
                  key: "newestIds" as const,
                  load: () =>
                    getDiscoverSectionIds({
                      cacheKey: CACHE_KEYS.newestResources,
                      limit: 8,
                      metricName: "discover.newestResources",
                      primaryLoader: () => findNewestResourceIds(8),
                      fallbackOrderBy: { createdAt: "desc" },
                    }),
                },
                {
                  key: "featuredIds" as const,
                  load: () =>
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
                },
                {
                  key: "freeIds" as const,
                  load: () =>
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
                },
                {
                  key: "topCreator" as const,
                  load: () => getTopCreatorForDiscover(),
                },
              ],
              // Phase 1 confirmed pgbouncer=true&connection_limit=2 in env.
              // Each section loader checks Redis first via rememberJson() so most
              // calls never open a DB connection. On a cold Redis miss, at most 3
              // queries contend for 2 pooler connections — the third queues briefly.
              // Raised from 1 (fully sequential) to 3 to reduce cold-path latency
              // without saturating the connection pool.
              3,
              async (entry) => ({
                key: entry.key,
                value: await entry.load(),
              }),
            );

            return Object.fromEntries(
              sectionSourceEntries.map(({ key, value }) => [key, value]),
            ) as DiscoverSectionSources;
          },
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
      }),
      { metricName: "discover.discoverData" },
    );
  },
  ["discover-data"],
  { revalidate: CACHE_TTLS.homepageList, tags: ["discover"] }
);

export async function getDiscoverData() {
  recordCacheCall("getDiscoverData");
  try {
    return await readDiscoverData();
  } catch (error) {
    if (!isDiscoverPoolPressureError(error)) throw error;
    console.warn("[DISCOVER_DATA_BEST_EFFORT]", error);
    return getEmptyDiscoverData();
  }
}

async function loadDiscoverResourcesByIds(resourceIds: string[]) {
  const rows = await traceServerStep(
    "discover.findDiscoverResourcesByIds",
    () => findDiscoverResourcesByIds(resourceIds),
    { resourceCount: resourceIds.length },
  );

  return new Map(rows.map((row) => {
    const resource = withPreview(row);
    return [resource.id, resource];
  }));
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
    return rememberJson(
      CACHE_KEYS.discoverCategories,
      CACHE_TTLS.homepageList,
      () =>
        runSingleFlight(CACHE_KEYS.discoverCategories, () =>
          runBestEffortAsync(() => findDiscoverCategoriesWithCounts(), {
            fallback: [],
            warningLabel: "[DISCOVER_CATEGORIES_BEST_EFFORT]",
          }),
        ),
      { metricName: "discover.discoverCategories" },
    );
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
export async function getHeroConfig(context?: {
  userId?: string | null;
  staticAnonSeed?: boolean;
}) {
  return resolveHomepageHero(context);
}
