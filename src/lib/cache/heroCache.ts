import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CACHE_TTLS } from "@/lib/cache";
import {
  findFallbackHero,
  findLegacyHomepageHero,
  listEligibleHomepageHeroes,
} from "@/repositories/heroes/hero.repository";

export const HERO_CACHE_KEY = "homepage-active-hero";
export const HERO_CACHE_TAG = "hero";
export const HERO_CACHE_TTL_SECONDS = CACHE_TTLS.homepageList;
export const HERO_FALLBACK_CACHE_KEY = "homepage-fallback-hero";
export const HERO_LEGACY_FALLBACK_CACHE_KEY = "homepage-legacy-fallback-hero";

function isHeroFallbackTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2024";
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("timed out fetching a new connection from the connection pool") ||
    message.includes("connection pool") ||
    message.includes("can't reach database server") ||
    message.includes("cannot reach database server") ||
    message.includes("database server") ||
    message.includes("connection limit")
  );
}

export const getCachedEligibleHomepageHeroes = unstable_cache(
  async function loadEligibleHomepageHeroes() {
    return listEligibleHomepageHeroes(new Date());
  },
  [HERO_CACHE_KEY],
  {
    revalidate: HERO_CACHE_TTL_SECONDS,
    tags: [HERO_CACHE_TAG],
  },
);

export const getCachedFallbackHero = unstable_cache(
  async function loadFallbackHero() {
    try {
      return await findFallbackHero();
    } catch (error) {
      if (!isHeroFallbackTransientDbError(error)) {
        throw error;
      }

      console.warn("[HERO_FALLBACK_BEST_EFFORT]", {
        cache: HERO_FALLBACK_CACHE_KEY,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },
  [HERO_FALLBACK_CACHE_KEY],
  {
    revalidate: HERO_CACHE_TTL_SECONDS,
    tags: [HERO_CACHE_TAG],
  },
);

export const getCachedLegacyHomepageHero = unstable_cache(
  async function loadLegacyHomepageHero() {
    return findLegacyHomepageHero();
  },
  [HERO_LEGACY_FALLBACK_CACHE_KEY],
  {
    revalidate: HERO_CACHE_TTL_SECONDS,
    tags: [HERO_CACHE_TAG],
  },
);
