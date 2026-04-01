import { unstable_cache } from "next/cache";
/**
 * Search Service
 *
 * Full-text resource search backed by Prisma `contains` filters.
 * Searches title, description, category name, and tag names.
 *
 * Results are scoped to published, non-deleted resources and ordered by
 * marketplace ranking signals from cached resource stats so higher-quality,
 * higher-conversion resources float to the top.
 *
 * This intentionally uses simple Postgres ILIKE (via Prisma's `insensitive`
 * mode) plus trigram indexes on the searched columns rather than a dedicated
 * search engine. It stays fast for typical catalogue sizes without adding
 * extra infrastructure.
 * If the catalogue grows, this function can be replaced with a full-text or
 * vector search backend without touching the API or UI layers.
 */

import { CACHE_KEYS, CACHE_TTLS, rememberJson, runSingleFlight } from "@/lib/cache";
import {
  findSearchResources,
  findSearchSuggestionResources,
} from "@/repositories/resources/resource.repository";
import { withPreview } from "@/services/discover.service";

type CachedFn<T> = () => Promise<T>;
type SearchRows = Awaited<ReturnType<typeof findSearchResources>>;
type SearchSuggestionRows = Awaited<ReturnType<typeof findSearchSuggestionResources>>;

const _searchResultsCacheMap = new Map<string, CachedFn<SearchRows>>();
const _searchSuggestionsCacheMap = new Map<string, CachedFn<SearchSuggestionRows>>();

export interface SearchFilters {
  query:    string;
  limit?:   number;
  category?: string; // optional category slug pre-filter
}

export interface SearchResult {
  id:            string;
  title:         string;
  slug:          string;
  price:         number;
  isFree:        boolean;
  downloadCount: number;
  previewUrl:    string | null;
  category:      { id: string; name: string; slug: string } | null;
  author:        { name: string | null } | null;
  _count:        { purchases: number; reviews: number };
  matchReason?:  string | null;
}

export interface SearchSuggestionResult {
  id: string;
  title: string;
  slug: string;
  price: number;
  isFree: boolean;
  previewUrl: string | null;
  category: { name: string } | null;
  author: { name: string | null } | null;
  matchReason?: string | null;
}

/**
 * Searches published resources matching `query`.
 *
 * Matches against:
 *   - resource title / slug
 *   - resource description
 *   - category name / slug
 *   - tag name / slug
 *   - creator name
 *   - tokenized query aliases such as worksheet/ใบงาน, flashcard/แฟลชการ์ด, and note/โน้ต
 *
 * Returns at most `limit` results (default 20), ordered by a weighted
 * relevance score with marketplace ranking signals as tie-breakers.
 * Returns an empty array when `query` is blank.
 */
export async function searchResources(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 20, category } = filters;

  const trimmed = query.trim().replace(/\s+/g, " ");
  if (!trimmed) return [];

  const cacheKey = CACHE_KEYS.searchResults(trimmed, category ?? null, limit);
  let cachedReader = _searchResultsCacheMap.get(cacheKey);

  if (!cachedReader) {
    cachedReader = unstable_cache(
      () =>
        rememberJson(
          cacheKey,
          CACHE_TTLS.publicPage,
          () =>
            runSingleFlight(cacheKey, () =>
              findSearchResources({
                query: trimmed,
                limit,
                category,
              }),
            ),
          {
            metricName: "searchResources",
            details: {
              query: trimmed,
              category: category ?? null,
              limit,
            },
          },
        ),
      ["search-results", cacheKey],
      { revalidate: CACHE_TTLS.publicPage },
    );
    _searchResultsCacheMap.set(cacheKey, cachedReader);
  }

  const raw = await cachedReader();

  return raw.map((row) =>
    withPreview({
      id: row.id,
      title: row.title,
      slug: row.slug,
      price: row.price,
      isFree: row.isFree,
      featured: row.featured,
      downloadCount: row.downloadCount,
      createdAt: row.createdAt,
      author: { name: row.authorName ?? null },
      category: row.categoryId
        ? {
            id: row.categoryId,
            name: row.categoryName ?? "",
            slug: row.categorySlug ?? "",
          }
        : null,
      previews: row.previewImageUrl ? [{ imageUrl: row.previewImageUrl }] : [],
      _count: {
        purchases: row.purchaseCount,
        reviews: row.reviewCount,
      },
      matchReason: row.matchReason,
    }),
  ) as SearchResult[];
}

export async function searchSuggestions(
  filters: SearchFilters,
): Promise<SearchSuggestionResult[]> {
  const { query, limit = 6, category } = filters;

  const trimmed = query.trim().replace(/\s+/g, " ");
  if (!trimmed) return [];

  const cacheKey = CACHE_KEYS.searchSuggestions(trimmed, category ?? null, limit);
  let cachedReader = _searchSuggestionsCacheMap.get(cacheKey);

  if (!cachedReader) {
    cachedReader = unstable_cache(
      () =>
        rememberJson(
          cacheKey,
          CACHE_TTLS.publicPage,
          () =>
            runSingleFlight(cacheKey, () =>
              findSearchSuggestionResources({
                query: trimmed,
                limit,
                category,
              }),
            ),
          {
            metricName: "searchSuggestions",
            details: {
              query: trimmed,
              category: category ?? null,
              limit,
            },
          },
        ),
      ["search-suggestions", cacheKey],
      { revalidate: CACHE_TTLS.publicPage },
    );
    _searchSuggestionsCacheMap.set(cacheKey, cachedReader);
  }

  const raw = await cachedReader();

  return raw.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      price: row.price,
      isFree: row.isFree,
      author: { name: row.authorName ?? null },
      category: row.categoryName ? { name: row.categoryName } : null,
      previewUrl: row.previewImageUrl ?? null,
      matchReason: row.matchReason,
    }));
}
