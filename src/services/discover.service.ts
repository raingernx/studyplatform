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
import { calculateTrendingScore } from "@/analytics/aggregation.service";
import { CACHE_KEYS, CACHE_TTLS, rememberJson } from "@/lib/cache";
import {
  logPerformanceEvent,
  recordCacheCall,
  recordCacheMiss,
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
      const since = new Date(Date.now() - DAY_MS * TRENDING_WINDOW_DAYS);
      const candidates = await findTrendingResourceSignals(since, Math.max(limit * 4, 24));

      if (candidates.length === 0) {
        return findTopTrendingResourceIds(limit);
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
    const [
      trendingIds,
      popularIdsFromStats,
      newestIdsFromStats,
      featuredIdsFromStats,
      freeIdsFromStats,
      topCreator,
    ] = await Promise.all([
      getTrendingResourceIds(8),
      rememberJson(CACHE_KEYS.popularResources, CACHE_TTLS.homepageList, () =>
        findTopDownloadedResourceIds(8),
      ),
      rememberJson(CACHE_KEYS.newestResources, CACHE_TTLS.homepageList, () =>
        findNewestResourceIds(8),
      ),
      rememberJson(CACHE_KEYS.featuredResources, CACHE_TTLS.homepageList, () =>
        findFeaturedResourceIds(8),
      ),
      rememberJson(CACHE_KEYS.freeResources, CACHE_TTLS.homepageList, () =>
        findFreeResourceIds(8),
      ),
      rememberJson(CACHE_KEYS.topCreator, CACHE_TTLS.homepageList, () =>
        findTopCreatorThisWeek(),
      ),
    ]);

    const [popularIds, newestIds, featuredIds, freeIds] = await Promise.all([
      popularIdsFromStats.length > 0
        ? popularIdsFromStats
        : findDiscoverFallbackResourceIds(8, [{ downloadCount: "desc" }, { createdAt: "desc" }]),
      newestIdsFromStats.length > 0
        ? newestIdsFromStats
        : findDiscoverFallbackResourceIds(8, { createdAt: "desc" }),
      featuredIdsFromStats.length > 0
        ? featuredIdsFromStats
        : findDiscoverFallbackResourceIds(8, [{ downloadCount: "desc" }, { createdAt: "desc" }], {
            featured: true,
          }),
      freeIdsFromStats.length > 0
        ? freeIdsFromStats
        : findDiscoverFallbackResourceIds(8, [{ downloadCount: "desc" }, { createdAt: "desc" }], {
            isFree: true,
          }),
    ]);

    const resourceIds = Array.from(
      new Set([
        ...trendingIds,
        ...popularIds,
        ...newestIds,
        ...featuredIds,
        ...freeIds,
      ]),
    );

    const pool = await loadDiscoverResourcesByIds(resourceIds);

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
  },
  ["discover-data"],
  { revalidate: CACHE_TTLS.homepageList, tags: ["discover"] }
);

export async function getDiscoverData() {
  recordCacheCall("getDiscoverData");
  return readDiscoverData();
}

async function loadDiscoverResourcesByIds(resourceIds: string[]) {
  const rows = await findDiscoverResourcesByIds(resourceIds);

  const resources = await attachResourceTrustSignals(rows);

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
