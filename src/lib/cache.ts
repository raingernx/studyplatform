import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const CACHE_TTLS = {
  homepageList: 60,
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

export const CACHE_KEYS = {
  activeHero: "active-hero",
  trendingResources: "trending_resources",
  popularResources: "popular_resources",
  newestResources: "newest_resources",
  featuredResources: "featured_resources",
  freeResources: "free_resources",
  topCreator: "top_creator",
  platformSettings: "platform_settings",
  platformTypographySettings: "platform_typography_settings",
  resourceStats: (resourceId: string) => `resource_stats:${resourceId}`,
  creatorStats: (creatorId: string) => `creator_stats:${creatorId}`,
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

export async function deleteCachedKey(key: string) {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("[cache] delete failed", { key, error });
  }
}

export async function rememberJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await getCachedJson<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await loader();
  await setCachedJson(key, value, ttlSeconds);
  return value;
}
