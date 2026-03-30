import { Redis } from "@upstash/redis";
import {
  recordCacheCall,
  recordCacheMiss,
} from "@/lib/performance/observability";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const inFlightLoads = new Map<string, Promise<unknown>>();

export const CACHE_TTLS = {
  // Increased from 60 → 300: discover-section ID lists (trending/popular/newest/
  // featured/free) are queried inside the unstable_cache wrapper for getDiscoverData
  // (outer TTL: 120 s). Keeping the Redis TTL shorter than the outer cache caused
  // Redis misses while the outer cache was still warm, triggering unnecessary DB
  // work on every Redis expiry cycle.  300 s ensures the Redis entries outlive
  // the outer cache so they are always warm on a getDiscoverData cache miss.
  homepageList: 300,
  hero: 60,
  stats: 300,
  publicPage: 120,
  platform: 300,
} as const;

export const CACHE_TAGS = {
  discover: "discover",
  creatorPublic: "creator-public",
  platform: "platform",
} as const;

export function getResourceCacheTag(slug: string) {
  return `resource:${slug}`;
}

export function getResourceDetailDataTag(resourceId: string) {
  return `resource-detail:${resourceId}`;
}

export function getCreatorPublicCacheTag(identifier: string) {
  return `creator:${identifier}`;
}

export const CACHE_KEYS = {
  activeHero: "active-hero",
  trendingResources: "trending_resources",
  popularResources: "popular_resources",
  newestResources: "newest_resources",
  featuredResources: "featured_resources",
  freeResources: "free_resources",
  topCreator: "top_creator",
  discoverData: "discover_data",
  discoverCategories: "discover_categories",
  resourceDetail: (slug: string) => `resource_detail:${slug}`,
  platformSettings: "platform_settings",
  marketplaceCategories: "marketplace_categories",
  marketplaceRecommendedListing: (categorySlug?: string | null) =>
    `marketplace_recommended_listing:${categorySlug ?? "all"}:page1:12`,
  resourceMetadata: (slug: string) => `resource_metadata:${slug}`,
  relatedResources: (categoryId: string, excludeId: string, take: number) =>
    `related_resources:${categoryId}:${excludeId}:${take}`,
  resourceStats: (resourceId: string) => `resource_stats:${resourceId}`,
  resourceTrustSummary: (resourceId: string) => `resource_trust_summary:${resourceId}`,
  resourceTrust: (resourceId: string) => `resource_trust:${resourceId}`,
  creatorStats: (creatorId: string) => `creator_stats:${creatorId}`,
  behaviorProfile: (userId: string) => `behavior_profile:${userId}`,
} as const;

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (error) {
    console.error("[cache] get failed", { key, error });
    return null;
  }
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds: number,
) {
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[cache] set failed", { key, error });
  }
}

/**
 * Fetches multiple keys from Redis in a single round-trip.
 * Returns an array aligned to the input keys; missing entries are `null`.
 * Falls back to all-null on error or when Redis is unavailable.
 */
export async function multiGetCachedJson<T>(keys: string[]): Promise<Array<T | null>> {
  if (!redis || keys.length === 0) return keys.map(() => null);

  try {
    const result = await redis.mget(...keys);
    return result as Array<T | null>;
  } catch (error) {
    console.error("[cache] mget failed", { keyCount: keys.length, error });
    return keys.map(() => null);
  }
}

export async function deleteCachedKey(key: string) {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("[cache] delete failed", { key, error });
  }
}

/**
 * Deletes all fixed-key Redis entries for the discover/marketplace public
 * cache layer.  Call alongside revalidateTag(CACHE_TAGS.discover) so that
 * both the per-instance (unstable_cache) and cross-instance (Redis) layers
 * are cleared together.
 *
 * Dynamic paginated listing keys (marketplace:sort:…, related_resources:…)
 * are not enumerable without a Redis SCAN; they expire at their TTL instead.
 */
export async function deleteDiscoverRedisKeys(): Promise<void> {
  await Promise.all([
    deleteCachedKey(CACHE_KEYS.discoverData),
    deleteCachedKey(CACHE_KEYS.discoverCategories),
    deleteCachedKey(CACHE_KEYS.marketplaceCategories),
    deleteMarketplaceRecommendedListingRedisKeys(),
    deleteCachedKey(`${CACHE_KEYS.trendingResources}:8`),
    deleteCachedKey(`${CACHE_KEYS.popularResources}:8`),
    deleteCachedKey(`${CACHE_KEYS.newestResources}:8`),
    deleteCachedKey(`${CACHE_KEYS.featuredResources}:8`),
    deleteCachedKey(`${CACHE_KEYS.freeResources}:8`),
    deleteCachedKey(CACHE_KEYS.topCreator),
  ]);
}

export async function deleteMarketplaceRecommendedListingRedisKeys(
  categorySlugs: Array<string | null | undefined> = [],
): Promise<void> {
  const uniqueCategorySlugs = Array.from(
    new Set(
      categorySlugs
        .map((categorySlug) => categorySlug?.trim())
        .filter(
          (categorySlug): categorySlug is string =>
            typeof categorySlug === "string" && categorySlug.length > 0,
        ),
    ),
  );

  await Promise.all([
    deleteCachedKey(CACHE_KEYS.marketplaceRecommendedListing()),
    ...uniqueCategorySlugs.map((categorySlug) =>
      deleteCachedKey(CACHE_KEYS.marketplaceRecommendedListing(categorySlug)),
    ),
  ]);
}

/**
 * Deletes the Redis entries for a single resource's public detail and
 * metadata cache.  Call alongside revalidateTag(getResourceCacheTag(slug)).
 */
export async function deleteResourceRedisKeys(slug: string): Promise<void> {
  await Promise.all([
    deleteCachedKey(CACHE_KEYS.resourceDetail(slug)),
    deleteCachedKey(CACHE_KEYS.resourceMetadata(slug)),
  ]);
}

/**
 * Deletes the Redis entries for a resource's trust signal cache (rating
 * average, review count, sales count).  Call alongside
 * revalidateTag(getResourceDetailDataTag(resourceId)).
 */
export async function deleteResourceTrustRedisKeys(resourceId: string): Promise<void> {
  await Promise.all([
    deleteCachedKey(CACHE_KEYS.resourceTrust(resourceId)),
    deleteCachedKey(CACHE_KEYS.resourceTrustSummary(resourceId)),
  ]);
}

/**
 * Deletes the Redis entries for the affected resource's own related-resources
 * panel on the public detail page. This is the only precise key we can evict
 * without scanning Redis for every resource in the same category.
 */
export async function deleteRelatedResourcesRedisKeys(
  resourceId: string,
  categoryIds: Array<string | null | undefined>,
  takes: number[] = [4],
): Promise<void> {
  const uniqueCategoryIds = Array.from(
    new Set(
      categoryIds.filter(
        (categoryId): categoryId is string =>
          typeof categoryId === "string" && categoryId.length > 0,
      ),
    ),
  );

  if (uniqueCategoryIds.length === 0 || takes.length === 0) {
    return;
  }

  await Promise.all(
    uniqueCategoryIds.flatMap((categoryId) =>
      takes.map((take) =>
        deleteCachedKey(CACHE_KEYS.relatedResources(categoryId, resourceId, take)),
      ),
    ),
  );
}

export async function rememberJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  options?: {
    metricName?: string;
    details?: Record<string, unknown>;
  },
): Promise<T> {
  if (options?.metricName) {
    recordCacheCall(options.metricName, options.details);
  }

  const cached = await getCachedJson<T>(key);
  if (cached !== null) {
    return cached;
  }

  if (options?.metricName) {
    recordCacheMiss(options.metricName, options.details);
  }

  const value = await loader();
  await setCachedJson(key, value, ttlSeconds);
  return value;
}

/**
 * Dedupes concurrent cache refresh work within the current process.
 *
 * This does not replace the persistent cache; it only prevents a local
 * thundering herd when many requests miss the same expensive key at once.
 */
export async function runSingleFlight<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const existing = inFlightLoads.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = Promise.resolve()
    .then(loader)
    .finally(() => {
      if (inFlightLoads.get(key) === promise) {
        inFlightLoads.delete(key);
      }
    });

  inFlightLoads.set(key, promise);
  return promise;
}
