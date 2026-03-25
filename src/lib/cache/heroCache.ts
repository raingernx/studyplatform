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
    return findFallbackHero();
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
