import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_TTLS, rememberJson, runSingleFlight } from "@/lib/cache";
import { buildSearchRecoveryQueries, normalizeSearchText } from "@/lib/search/query-intent";
import {
  findSearchRecoveryCategories,
  findSearchRecoveryTags,
  type SearchRecoveryTaxonomyMatch,
} from "@/repositories/resources/resource.repository";

export interface SearchRecoveryData {
  suggestedQueries: string[];
  categoryMatches: SearchRecoveryTaxonomyMatch[];
  tagMatches: SearchRecoveryTaxonomyMatch[];
}

type CachedFn<T> = () => Promise<T>;

const _searchRecoveryCacheMap = new Map<string, CachedFn<SearchRecoveryData>>();

export async function getSearchRecoveryData(
  query: string,
): Promise<SearchRecoveryData> {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return {
      suggestedQueries: [],
      categoryMatches: [],
      tagMatches: [],
    };
  }

  const cacheKey = CACHE_KEYS.searchRecovery(normalizedQuery);
  let cachedReader = _searchRecoveryCacheMap.get(cacheKey);

  if (!cachedReader) {
    cachedReader = unstable_cache(
      () =>
        rememberJson(
          cacheKey,
          CACHE_TTLS.publicPage,
          () =>
            runSingleFlight(cacheKey, async () => {
              const [categoryMatches, tagMatches] = await Promise.all([
                findSearchRecoveryCategories({ query: normalizedQuery, limit: 4 }),
                findSearchRecoveryTags({ query: normalizedQuery, limit: 6 }),
              ]);

              const suggestedQueries = buildSearchRecoveryQueries(
                normalizedQuery,
                [
                  ...categoryMatches.map((match) => match.name),
                  ...tagMatches.map((match) => match.name),
                ],
                6,
              );

              return {
                suggestedQueries,
                categoryMatches,
                tagMatches,
              };
            }),
          {
            metricName: "getSearchRecoveryData",
            details: {
              query: normalizedQuery,
            },
          },
        ),
      ["search-recovery", cacheKey],
      { revalidate: CACHE_TTLS.publicPage },
    );
    _searchRecoveryCacheMap.set(cacheKey, cachedReader);
  }

  return cachedReader();
}
