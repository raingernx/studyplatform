import { unstable_cache } from "next/cache";
import { listEligibleHomepageHeroes } from "@/repositories/heroes/hero.repository";

export const HERO_CACHE_KEY = "homepage-active-hero";
export const HERO_CACHE_TAG = "hero";
export const HERO_CACHE_TTL_SECONDS = 60;

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
