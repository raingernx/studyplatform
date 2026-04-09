/**
 * Marketplace Resource Read Service
 *
 * Owns public marketplace listing and resource-detail reads that back
 * catalogue browsing, metadata, and related-resource sections.
 *
 * All public-facing functions apply LISTED_RESOURCE_WHERE automatically so
 * draft / archived / soft-deleted resources are never accidentally exposed.
 *
 * Discover-section card shaping still comes from `discover.service.ts`
 * so marketplace and homepage lists share the same lightweight output shape.
 */

import { cache } from "react";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  CACHE_KEYS,
  CACHE_TAGS,
  CACHE_TTLS,
  getResourceCacheTag,
  rememberJson,
  runSingleFlight,
} from "@/lib/cache";
import {
  logPerformanceEvent,
  recordCacheCall,
  recordCacheMiss,
  traceServerStep,
} from "@/lib/performance/observability";
import { MARKETPLACE_LISTING_PAGE_SIZE } from "@/config/marketplace";
import { getEffectiveMarketplaceSort } from "@/config/sortOptions";
import {
  countMarketplaceResources,
  findActivationRankedResourceCards,
  findActivationRankedResources,
  findCategoryBySlug,
  findCategoriesOrderedByName,
  findMarketplaceSearchResources,
  findPublicResourceDetailBodyContentBySlug,
  findMarketplaceResourceCards,
  findPublicResourceDetailFooterContentBySlug,
  findPublicResourceDetailMetadataBySlug,
  findPublicResourceDetailPurchaseMetaBySlug,
  findPublicResourceDetailShellBySlug,
  findRelatedListedResources,
  type FindActivationRankedResourcesRow,
  type RankedSearchResourceRow,
} from "@/repositories/resources/resource.repository";
import { withPreview } from "@/services/discover";

// ── Standard include fragment (for detail pages that need all relations) ───────

/**
 * Full include used when ALL resource relations are needed (detail pages,
 * admin views, API routes).  For lightweight card lists, use
 * `RESOURCE_CARD_SELECT` / `RESOURCE_CARD_WITH_TAGS_SELECT` instead.
 */
export const RESOURCE_CARD_INCLUDE = {
  author:   { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags:     { include: { tag: { select: { name: true, slug: true } } } },
  previews: { orderBy: { order: "asc" as const }, select: { imageUrl: true } },
  _count:   { select: { purchases: true, reviews: true } },
} as const;

// ── Activation ranking transform ──────────────────────────────────────────────

/**
 * Transforms a flat raw-SQL activation-ranked row into the nested shape that
 * the marketplace card UI expects — identical to what Prisma returns when
 * using `RESOURCE_CARD_SELECT`.
 */
function toActivationRankedCardShape(row: FindActivationRankedResourcesRow) {
  return {
    id:            row.id,
    title:         row.title,
    slug:          row.slug,
    price:         row.price,
    isFree:        row.isFree,
    featured:      row.featured,
    downloadCount: row.downloadCount,
    createdAt:     row.createdAt,
    author:   { name: row.authorName ?? null },
    category: row.categoryId !== null
      ? { id: row.categoryId, name: row.categoryName ?? "", slug: row.categorySlug ?? "" }
      : null,
    previews: row.previewImageUrl ? [{ imageUrl: row.previewImageUrl }] : [],
  };
}

function toRankedSearchCardShape(row: RankedSearchResourceRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    price: row.price,
    isFree: row.isFree,
    featured: row.featured,
    downloadCount: row.downloadCount,
    createdAt: row.createdAt,
    author: { name: row.authorName ?? null },
    category: row.categoryId !== null
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
    socialProofLabel: row.matchReason ?? null,
  };
}

type RelatedResourceCard = Awaited<ReturnType<typeof findRelatedListedResources>>[number] & {
  previewUrl: string | null;
  rating?: number | null;
  reviewCount?: number;
  salesCount?: number;
};

// ── Filtered marketplace listing ──────────────────────────────────────────────

export interface MarketplaceFilters {
  search?:   string;
  category?: string;
  price?:    string;
  featured?: boolean;
  tag?:      string;
  sort?:     string;
  page?:     number;
  pageSize?: number;
}

export const MARKETPLACE_DEFAULT_PAGE = 1;
export const MARKETPLACE_DEFAULT_PAGE_SIZE = 20;

export interface NormalizedMarketplaceFilters {
  search: string | null;
  category: string | null;
  price: "free" | "paid" | null;
  featured: boolean;
  tag: string | null;
  sort: string;
  page: number;
  pageSize: number;
}

function normalizeOptionalMarketplaceText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeMarketplacePage(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MARKETPLACE_DEFAULT_PAGE;
  }

  return Math.max(MARKETPLACE_DEFAULT_PAGE, Math.trunc(value));
}

function normalizeMarketplacePageSize(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MARKETPLACE_DEFAULT_PAGE_SIZE;
  }

  return Math.max(1, Math.trunc(value));
}

export function normalizeMarketplaceFilters(
  filters: MarketplaceFilters,
): NormalizedMarketplaceFilters {
  const category = normalizeOptionalMarketplaceText(filters.category);
  const rawPrice = normalizeOptionalMarketplaceText(filters.price);

  return {
    search: normalizeOptionalMarketplaceText(filters.search),
    category: category === "all" ? null : category,
    price: rawPrice === "free" || rawPrice === "paid" ? rawPrice : null,
    featured: filters.featured === true,
    tag: normalizeOptionalMarketplaceText(filters.tag),
    sort: getEffectiveMarketplaceSort(filters.sort, Boolean(filters.search?.trim())),
    page: normalizeMarketplacePage(filters.page),
    pageSize: normalizeMarketplacePageSize(filters.pageSize),
  };
}

export function getMarketplaceCacheKey(filters: NormalizedMarketplaceFilters) {
  return JSON.stringify(filters);
}

const _cachedMarketplaceCategories = unstable_cache(
  async function _getMarketplaceCategories() {
    recordCacheMiss("getMarketplaceCategories");
    return rememberJson(
      CACHE_KEYS.marketplaceCategories,
      CACHE_TTLS.homepageList,
      () => findCategoriesOrderedByName(),
      { metricName: "marketplace.categories" },
    );
  },
  ["marketplace-categories"],
  {
    revalidate: CACHE_TTLS.homepageList,
    tags: [CACHE_TAGS.discover],
  },
);

async function getCachedMarketplaceCategories() {
  recordCacheCall("getMarketplaceCategories");
  return _cachedMarketplaceCategories();
}

/** Builds a Prisma `orderBy` clause from a sort key string.
 *
 * Canonical values (from SORT_OPTIONS in src/config/sortOptions.ts):
 *   trending | newest | downloads | price_asc | price_desc
 *
 * Legacy values kept as silent fallbacks so that old bookmarked URLs
 * continue to resolve sensibly:
 *   popular → same as downloads
 *   oldest / featured → internal admin use only, not shown in the UI
 */
export function buildOrderBy(sort: string) {
  switch (sort) {
    case "downloads":
    case "popular":
      return [
        { resourceStat: { downloads: "desc" } },
        { resourceStat: { purchases: "desc" } },
        { resourceStat: { trendingScore: "desc" } },
        { createdAt: "desc" },
      ] as const;
    case "price_asc":  return { price: "asc" }          as const;
    case "price_desc": return { price: "desc" }         as const;
    case "trending":
    case "relevance":
      return [
        { resourceStat: { trendingScore: "desc" } },
        { resourceStat: { purchases: "desc" } },
        { resourceStat: { downloads: "desc" } },
        { createdAt: "desc" },
      ] as const;
    // Internal / legacy — not exposed in the public sort UI
    case "oldest":     return { createdAt: "asc" }      as const;
    case "featured":
      return [
        { featured: "desc" },
        { resourceStat: { trendingScore: "desc" } },
        { createdAt: "desc" },
      ] as const;
    case "newest":
    default:           return { createdAt: "desc" }     as const;
  }
}

function getPrecomputedRecommendedListingCacheKey(
  filters: NormalizedMarketplaceFilters,
) {
  const isCandidate =
    filters.search === null &&
    filters.price === null &&
    filters.featured === false &&
    filters.tag === null &&
    filters.sort === "recommended" &&
    filters.page === MARKETPLACE_DEFAULT_PAGE &&
    filters.pageSize === MARKETPLACE_LISTING_PAGE_SIZE;

  if (!isCandidate) {
    return null;
  }

  return CACHE_KEYS.marketplaceRecommendedListing(filters.category);
}

function getPrecomputedNewestListingCacheKey(
  filters: NormalizedMarketplaceFilters,
) {
  const isCandidate =
    filters.search === null &&
    filters.price === null &&
    filters.featured === false &&
    filters.tag === null &&
    filters.sort === "newest" &&
    filters.page === MARKETPLACE_DEFAULT_PAGE &&
    filters.pageSize === MARKETPLACE_LISTING_PAGE_SIZE;

  if (!isCandidate) {
    return null;
  }

  return CACHE_KEYS.marketplaceNewestListing(filters.category);
}

function isAllCategoryFirstPageLanding(filters: NormalizedMarketplaceFilters) {
  return (
    filters.search === null &&
    filters.category === null &&
    filters.price === null &&
    filters.featured === false &&
    filters.tag === null &&
    filters.page === MARKETPLACE_DEFAULT_PAGE &&
    filters.pageSize === MARKETPLACE_LISTING_PAGE_SIZE
  );
}

function getListingTotalCacheKey(filters: NormalizedMarketplaceFilters) {
  return CACHE_KEYS.marketplaceListingTotal(
    filters.sort,
    filters.category,
    filters.tag,
    filters.price === "free" ? "free" : filters.price === "paid" ? "paid" : "any",
    filters.featured,
  );
}

async function getCachedMarketplaceListingTotal(
  filters: NormalizedMarketplaceFilters,
  where: Prisma.ResourceWhereInput,
) {
  const cacheKey = getListingTotalCacheKey(filters);

  return rememberJson(
    cacheKey,
    CACHE_TTLS.listingLanding,
    () =>
      runSingleFlight(cacheKey, () =>
        traceServerStep(
          "marketplace.countResources",
          () => countMarketplaceResources(where),
          {
            category: filters.category ?? "all",
            sort: filters.sort,
          },
        ),
      ),
    {
      metricName: "marketplace.listingTotal",
      details: {
        category: filters.category ?? "all",
        sort: filters.sort,
      },
    },
  );
}

/**
 * Returns a paginated list of published resources matching the supplied
 * filters, together with the full category list for the filter sidebar.
 */
async function loadMarketplaceResources(filters: NormalizedMarketplaceFilters) {
  const {
    search,
    category,
    price,
    featured,
    tag,
    sort,
    page,
    pageSize,
  } = filters;

  const searchWhere = search
    ? {
        OR: [
          { title:       { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Fetch categories once upfront (cached, 120 s TTL). Reuse the result for:
  //   (a) slug → id resolution — eliminates the previous uncached findCategoryBySlug
  //       DB round-trip that preceded every category-filtered listing query.
  //   (b) the categories sidebar list returned in every response path.
  // Staleness: a newly created category will not appear for up to 120 s —
  // consistent with the existing cache behaviour for the sidebar list.
  const categoriesPromise = getCachedMarketplaceCategories();
  let categories:
    | Awaited<ReturnType<typeof getCachedMarketplaceCategories>>
    | null = null;

  const loadCategories = async () => {
    if (categories) {
      return categories;
    }

    categories = await categoriesPromise;
    return categories;
  };

  const categoryId = category
    ? (await loadCategories()).find((c) => c.slug === category)?.id
    : undefined;

  if (category && !categoryId) {
    return {
      resources: [],
      total: 0,
      totalPages: 1,
      categories: await loadCategories(),
    };
  }

  if (search) {
    const [resolvedCategories, { rows, total }] = await Promise.all([
      loadCategories(),
      traceServerStep(
        "marketplace.findRankedSearchResources",
        () =>
          findMarketplaceSearchResources({
            query: search,
            page,
            pageSize,
            category: category ?? undefined,
            sort,
          }),
        {
          page,
          pageSize,
          sort,
          category: category ?? "all",
        },
      ),
    ]);

    const resources = rows.map((row) => withPreview(toRankedSearchCardShape(row)));
    return {
      resources,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      categories: resolvedCategories,
    };
  }

  // ── Activation-weighted "recommended" sort ─────────────────────────────────
  if (sort === "recommended") {
    const isFreeFilter =
      price === "free" ? true : price === "paid" ? false : undefined;
    const shouldSplitTotalFromRows = isAllCategoryFirstPageLanding(filters);

    // Build a deterministic Redis cache key from all parameters that affect
    // the multi-CTE SQL.  Search queries bypass this so the key space stays
    // bounded (matching the outer unstable_cache search bypass above).
    const recommendedCacheKey = [
      "marketplace:recommended",
      categoryId ?? "all",
      tag ?? "none",
      isFreeFilter ?? "any",
      featured ? "1" : "0",
      page,
      pageSize,
    ].join(":");

    const loadRankedRows = () =>
      traceServerStep(
        "marketplace.findActivationRankedResources",
        () => findActivationRankedResources({
          categoryId,
          tagSlug:  tag ?? undefined,
          search:   search ?? undefined,
          isFree:   isFreeFilter,
          featured: featured || undefined,
          page,
          pageSize,
        }),
        { page, pageSize, categoryId: categoryId ?? "all" },
      );
    const loadRankedRowsWithoutTotal = () =>
      traceServerStep(
        "marketplace.findActivationRankedResourceCards",
        () =>
          findActivationRankedResourceCards({
            categoryId,
            tagSlug: tag ?? undefined,
            search: search ?? undefined,
            isFree: isFreeFilter,
            featured: featured || undefined,
            page,
            pageSize,
          }),
        { page, pageSize, categoryId: categoryId ?? "all" },
      );

    const precomputedRecommendedListingCacheKey =
      getPrecomputedRecommendedListingCacheKey(filters);

    if (precomputedRecommendedListingCacheKey) {
      const loadRecommendedLanding = async () => {
        const [rows, total] = shouldSplitTotalFromRows
          ? await Promise.all([
              loadRankedRowsWithoutTotal(),
              getCachedMarketplaceListingTotal(filters, {
                status: "PUBLISHED",
                deletedAt: null,
                ...(categoryId ? { categoryId } : {}),
                ...(isFreeFilter !== undefined ? { isFree: isFreeFilter } : {}),
                ...(featured ? { featured: true } : {}),
                ...(tag
                  ? { tags: { some: { tag: { slug: tag } } } }
                  : {}),
              }),
            ])
          : await loadRankedRows().then(({ rows, total }) => [rows, total] as const);
        return {
          resources: rows.map((row) => withPreview(toActivationRankedCardShape(row))),
          total,
        };
      };

      const [resolvedCategories, { resources, total }] = await Promise.all([
        loadCategories(),
        rememberJson(
          precomputedRecommendedListingCacheKey,
          CACHE_TTLS.listingLanding,
          () =>
            runSingleFlight(
              precomputedRecommendedListingCacheKey,
              loadRecommendedLanding,
            ),
          {
            metricName: "marketplace.recommendedResources.precomputed",
            details: {
              page,
              pageSize,
              categorySlug: category ?? "all",
              scope: "listing",
            },
          },
        ),
      ]);

      return {
        resources,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        categories: resolvedCategories,
      };
    }

    // Cache in shared Redis (cross-instance) when no search term is present.
    // The outer unstable_cache layer handles same-instance warm hits; this
    // Redis layer prevents cold Vercel instances from each re-running the
    // expensive multi-CTE activation-ranking SQL.
    //
    // runSingleFlight wraps the loader so that if rememberJson is called
    // concurrently from the same Vercel instance (e.g. multiple requests
    // that all miss unstable_cache simultaneously), only one SQL execution
    // fires per instance.  NOTE: this is same-instance deduplication only.
    // Cross-instance thundering herd (separate Vercel function processes)
    // cannot be solved here without distributed locking.
    const [resolvedCategories, { rows, total }] = await Promise.all([
      loadCategories(),
      search
        ? loadRankedRows()
        : rememberJson(
            recommendedCacheKey,
            CACHE_TTLS.homepageList,
            () =>
              runSingleFlight(recommendedCacheKey, async () => {
                if (!shouldSplitTotalFromRows) {
                  return loadRankedRows();
                }

                const [rows, total] = await Promise.all([
                  loadRankedRowsWithoutTotal(),
                  getCachedMarketplaceListingTotal(filters, {
                    status: "PUBLISHED",
                    deletedAt: null,
                    ...(categoryId ? { categoryId } : {}),
                    ...(isFreeFilter !== undefined ? { isFree: isFreeFilter } : {}),
                    ...(featured ? { featured: true } : {}),
                    ...(tag
                      ? { tags: { some: { tag: { slug: tag } } } }
                      : {}),
                  }),
                ]);

                return { rows, total };
              }),
            {
              metricName: "marketplace.recommendedResources",
              details: { page, pageSize, categoryId: categoryId ?? "all" },
            },
          ),
    ]);

    // Recommended listing cards can render without trust metadata, so avoid
    // blocking the strict first render on batched review/sales enrichment.
    const resources = rows.map((row) => withPreview(toActivationRankedCardShape(row)));

    return {
      resources,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      categories: resolvedCategories,
    };
  }
  // ── All other sort values use the standard Prisma path ─────────────────────

  const categoryWhere = categoryId ? { categoryId } : {};

  const priceWhere =
    price === "free" ? { isFree: true } : price === "paid" ? { isFree: false } : {};

  const featuredWhere = featured ? { featured: true } : {};

  const tagWhere = tag
    ? { tags: { some: { tag: { slug: tag } } } }
    : {};

  const where = {
    status: "PUBLISHED" as const,
    deletedAt: null,
    ...searchWhere,
    ...categoryWhere,
    ...priceWhere,
    ...featuredWhere,
    ...tagWhere,
  };

  const skip = (page - 1) * pageSize;
  const orderBy = buildOrderBy(sort) as Prisma.ResourceFindManyArgs["orderBy"];

  // ── Newest sort: Redis cross-instance cache ─────────────────────────────────
  // unstable_cache alone does not survive Vercel horizontal scale-out: each
  // new lambda instance incurs a full cold-path hit (findMany + count) before
  // its local Data Cache warms. rememberJson stores the raw query results in
  // shared Redis so cold instances return in <300 ms instead of 3–7 s. Same
  // rationale as the recommended path.
  if (sort === "newest" && !search) {
    const precomputedNewestListingCacheKey =
      getPrecomputedNewestListingCacheKey(filters);
    const newestCacheKey = [
      "marketplace:newest",
      categoryId ?? "all",
      tag ?? "none",
      price === "free" ? "free" : price === "paid" ? "paid" : "any",
      featured ? "1" : "0",
      page,
      pageSize,
    ].join(":");
    const shouldSplitTotalFromRows = isAllCategoryFirstPageLanding(filters);

    const loadNewestRows = () =>
      traceServerStep(
        "marketplace.findNewestResources",
        async () => {
          const [items, count] = await Promise.all([
            findMarketplaceResourceCards({ where, orderBy, skip, take: pageSize }),
            countMarketplaceResources(where),
          ]);
          return { items, count };
        },
        { page, pageSize, categoryId: categoryId ?? "all" },
      );
    const loadNewestRowsWithoutTotal = () =>
      traceServerStep(
        "marketplace.findNewestResourceCards",
        () =>
          findMarketplaceResourceCards({
            where,
            orderBy,
            skip,
            take: pageSize,
          }),
        { page, pageSize, categoryId: categoryId ?? "all" },
      );

    if (precomputedNewestListingCacheKey) {
      const loadNewestLanding = async () => {
        const [items, count] = shouldSplitTotalFromRows
          ? await Promise.all([
              loadNewestRowsWithoutTotal(),
              getCachedMarketplaceListingTotal(filters, where),
            ])
          : await loadNewestRows().then(({ items, count }) => [items, count] as const);
        return {
          resources: items.map(withPreview),
          total: count,
        };
      };

      const [resolvedCategories, { resources, total }] = await Promise.all([
        loadCategories(),
        rememberJson(
          precomputedNewestListingCacheKey,
          CACHE_TTLS.listingLanding,
          () =>
            runSingleFlight(precomputedNewestListingCacheKey, loadNewestLanding),
          {
            metricName: "marketplace.newestResources.precomputed",
            details: {
              page,
              pageSize,
              categorySlug: category ?? "all",
              scope: "listing",
            },
          },
        ),
      ]);

      return {
        resources,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        categories: resolvedCategories,
      };
    }

    const [resolvedCategories, { items: newestItems, count: newestTotal }] =
      await Promise.all([
        loadCategories(),
        rememberJson(
          newestCacheKey,
          CACHE_TTLS.publicPage,
          () =>
            runSingleFlight(newestCacheKey, async () => {
              if (!shouldSplitTotalFromRows) {
                return loadNewestRows();
              }

              const [items, count] = await Promise.all([
                loadNewestRowsWithoutTotal(),
                getCachedMarketplaceListingTotal(filters, where),
              ]);

              return { items, count };
            }),
          {
            metricName: "marketplace.newestResources",
            details: { page, pageSize, categoryId: categoryId ?? "all" },
          },
        ),
      ]);

    const resources = newestItems.map(withPreview);
    return {
      resources,
      total: newestTotal,
      totalPages: Math.max(1, Math.ceil(newestTotal / pageSize)),
      categories: resolvedCategories,
    };
  }

  // ── All other sorts: Redis cross-instance cache ──────────────────────────────
  // trending, downloads/popular, price_asc, price_desc, oldest, featured, etc.
  // Same pattern as the newest path above.  Guarded by !search so free-text
  // results (which are always unique to the query string) are never cached.
  if (!search) {
    const sortCacheKey = [
      "marketplace",
      sort,
      categoryId ?? "all",
      tag ?? "none",
      price === "free" ? "free" : price === "paid" ? "paid" : "any",
      featured ? "1" : "0",
      page,
      pageSize,
    ].join(":");

    const loadSortRows = () =>
      traceServerStep(
        "marketplace.findSortedResources",
        async () => {
          const [items, count] = await Promise.all([
            findMarketplaceResourceCards({ where, orderBy, skip, take: pageSize }),
            countMarketplaceResources(where),
          ]);
          return { items, count };
        },
        { sort, page, pageSize, categoryId: categoryId ?? "all" },
      );

    const [resolvedCategories, { items: sortedItems, count: sortedTotal }] =
      await Promise.all([
        loadCategories(),
        rememberJson(
          sortCacheKey,
          CACHE_TTLS.publicPage,
          () => runSingleFlight(sortCacheKey, loadSortRows),
          {
            metricName: "marketplace.sortedResources",
            details: { sort, page, pageSize, categoryId: categoryId ?? "all" },
          },
        ),
      ]);

    const resources = sortedItems.map(withPreview);
    return {
      resources,
      total: sortedTotal,
      totalPages: Math.max(1, Math.ceil(sortedTotal / pageSize)),
      categories: resolvedCategories,
    };
  }

  const [resolvedCategories, rawItems, total] = await Promise.all([
    loadCategories(),
    findMarketplaceResourceCards({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    countMarketplaceResources(where),
  ]);

  const resources = rawItems.map(withPreview);

  return {
    resources,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    categories: resolvedCategories,
  };
}

type MarketplaceResourcesResult = Awaited<
  ReturnType<typeof loadMarketplaceResources>
>;
const MARKETPLACE_SEARCH_CACHE_MAX_KEYS = 64;
const _marketplaceResourcesCacheMap = new Map<
  string,
  () => Promise<MarketplaceResourcesResult>
>();
const _marketplaceSearchResourcesCacheMap = new Map<
  string,
  () => Promise<MarketplaceResourcesResult>
>();
type CategoryLandingPageResult = {
  items: Array<Awaited<ReturnType<typeof findMarketplaceResourceCards>>[number] & { previewUrl: string | null }>;
  total: number;
};
const _categoryLandingPageCacheMap = new Map<
  string,
  () => Promise<CategoryLandingPageResult>
>();

function readBoundedCachedFn<T>(
  map: Map<string, () => Promise<T>>,
  key: string,
) {
  const cachedFn = map.get(key);
  if (!cachedFn) {
    return null;
  }

  map.delete(key);
  map.set(key, cachedFn);
  return cachedFn;
}

function writeBoundedCachedFn<T>(
  map: Map<string, () => Promise<T>>,
  key: string,
  cachedFn: () => Promise<T>,
  maxKeys: number,
) {
  if (map.has(key)) {
    map.delete(key);
  }

  while (map.size >= maxKeys) {
    const oldestKey = map.keys().next().value;
    if (!oldestKey) {
      break;
    }
    map.delete(oldestKey);
  }

  map.set(key, cachedFn);
}

function getReusableMarketplaceSearchListingCacheKey(
  filters: NormalizedMarketplaceFilters,
) {
  if (
    filters.search === null ||
    filters.featured ||
    filters.price !== null ||
    filters.tag !== null ||
    filters.page !== MARKETPLACE_DEFAULT_PAGE ||
    filters.pageSize !== MARKETPLACE_LISTING_PAGE_SIZE
  ) {
    return null;
  }

  return CACHE_KEYS.marketplaceSearchListing(
    filters.search,
    filters.category,
    filters.sort,
    filters.page,
    filters.pageSize,
  );
}

export async function getMarketplaceResources(filters: MarketplaceFilters) {
  const normalizedFilters = normalizeMarketplaceFilters(filters);
  const cacheKey = getMarketplaceCacheKey(normalizedFilters);
  const singleFlightKey = `marketplace:${normalizedFilters.sort}:${cacheKey}`;
  const hasPrecomputedLandingCache =
    getPrecomputedRecommendedListingCacheKey(normalizedFilters) !== null ||
    getPrecomputedNewestListingCacheKey(normalizedFilters) !== null;
  const revalidateSeconds = hasPrecomputedLandingCache
    ? CACHE_TTLS.listingLanding
    : normalizedFilters.sort === "recommended"
      ? CACHE_TTLS.homepageList
      : CACHE_TTLS.publicPage;

  recordCacheCall("getMarketplaceResources", {
    cacheKey,
    category: normalizedFilters.category ?? "all",
    page: normalizedFilters.page,
    sort: normalizedFilters.sort,
  });

  if (normalizedFilters.search !== null) {
    const reusableSearchCacheKey =
      getReusableMarketplaceSearchListingCacheKey(normalizedFilters);

    if (!reusableSearchCacheKey) {
      recordCacheMiss("getMarketplaceResources", {
        cacheKey,
        category: normalizedFilters.category ?? "all",
        page: normalizedFilters.page,
        sort: normalizedFilters.sort,
      });
      logPerformanceEvent("cache_bypass:getMarketplaceResources", {
        category: normalizedFilters.category ?? "all",
        page: normalizedFilters.page,
        pageSize: normalizedFilters.pageSize,
        sort: normalizedFilters.sort,
      });
      return loadMarketplaceResources(normalizedFilters);
    }

    let cachedFn = readBoundedCachedFn(
      _marketplaceSearchResourcesCacheMap,
      reusableSearchCacheKey,
    );

    if (!cachedFn) {
      // Search listings are dynamic enough that we avoid a Redis cross-instance
      // layer here; keep the cache local, bounded, and short-lived so repeated
      // first-page searches can reuse the same render work without accumulating
      // unbounded query keys or stale shared search results.
      cachedFn = unstable_cache(
        async function _getReusableMarketplaceSearchResourcesByKey() {
          recordCacheMiss("getMarketplaceResources", {
            cacheKey,
            category: normalizedFilters.category ?? "all",
            page: normalizedFilters.page,
            sort: normalizedFilters.sort,
          });
          logPerformanceEvent("cache_execute:getMarketplaceSearchResources", {
            category: normalizedFilters.category ?? "all",
            page: normalizedFilters.page,
            pageSize: normalizedFilters.pageSize,
            sort: normalizedFilters.sort,
          });
          return runSingleFlight(singleFlightKey, () =>
            loadMarketplaceResources(normalizedFilters),
          );
        },
        ["marketplace-search-resources", reusableSearchCacheKey],
        {
          revalidate: CACHE_TTLS.publicPage,
          tags: [CACHE_TAGS.discover],
        },
      );

      writeBoundedCachedFn(
        _marketplaceSearchResourcesCacheMap,
        reusableSearchCacheKey,
        cachedFn,
        MARKETPLACE_SEARCH_CACHE_MAX_KEYS,
      );
    }

    return cachedFn();
  }

  let cachedFn = _marketplaceResourcesCacheMap.get(cacheKey);
  if (!cachedFn) {
    // Keep one unstable_cache wrapper per normalized listing key. Recreating
    // the wrapper on every call weakens same-instance deduplication and can
    // reintroduce cold-tail variance even when the underlying Redis layer is hot.
    cachedFn = unstable_cache(
      async function _getMarketplaceResourcesByKey() {
        recordCacheMiss("getMarketplaceResources", {
          cacheKey,
          category: normalizedFilters.category ?? "all",
          page: normalizedFilters.page,
          sort: normalizedFilters.sort,
        });
        logPerformanceEvent("cache_execute:getMarketplaceResources", {
          category: normalizedFilters.category ?? "all",
          page: normalizedFilters.page,
          pageSize: normalizedFilters.pageSize,
          sort: normalizedFilters.sort,
        });
        if (
          normalizedFilters.sort === "newest" ||
          normalizedFilters.sort === "recommended"
        ) {
          return runSingleFlight(singleFlightKey, () =>
            loadMarketplaceResources(normalizedFilters),
          );
        }

        return loadMarketplaceResources(normalizedFilters);
      },
      ["marketplace-resources", cacheKey],
      {
        revalidate: revalidateSeconds,
        tags: [CACHE_TAGS.discover],
      },
    );
    _marketplaceResourcesCacheMap.set(cacheKey, cachedFn);
  }

  return cachedFn();
}

async function loadCategoryLandingPageData(categorySlug: string) {
  const category = await traceServerStep(
    "marketplace.findCategoryLandingTarget",
    () => findCategoryBySlug(categorySlug),
    { categorySlug },
  );

  if (!category) {
    return { items: [], total: 0 };
  }

  const where = {
    status: "PUBLISHED" as const,
    deletedAt: null,
    categoryId: category.id,
  };

  const [items, total] = await traceServerStep(
    "marketplace.findCategoryLandingResources",
    () =>
      Promise.all([
        findMarketplaceResourceCards({
          where,
          orderBy: buildOrderBy("newest") as Prisma.ResourceFindManyArgs["orderBy"],
          skip: 0,
          take: 12,
        }),
        countMarketplaceResources(where),
      ]),
    { categorySlug },
  );

  return {
    items: items.map(withPreview),
    total,
  };
}

export async function getCategoryLandingPageData(categorySlug: string) {
  recordCacheCall("getCategoryLandingPageData", { categorySlug });

  let cachedFn = _categoryLandingPageCacheMap.get(categorySlug);
  if (!cachedFn) {
    cachedFn = unstable_cache(
      async function _getCategoryLandingPageData() {
        recordCacheMiss("getCategoryLandingPageData", { categorySlug });
        logPerformanceEvent("cache_execute:getCategoryLandingPageData", {
          categorySlug,
        });
        return runSingleFlight(`category-landing:${categorySlug}`, () =>
          loadCategoryLandingPageData(categorySlug),
        );
      },
      ["category-landing-page", categorySlug],
      {
        revalidate: CACHE_TTLS.homepageList,
        tags: [CACHE_TAGS.discover],
      },
    );
    _categoryLandingPageCacheMap.set(categorySlug, cachedFn);
  }

  return cachedFn();
}

// ── Single resource detail ────────────────────────────────────────────────────

const RESOURCE_DETAIL_REVALIDATE_SECONDS = CACHE_TTLS.resourceDetail;

// Module-level Maps ensure each slug gets exactly one stable unstable_cache
// function reference for its lifetime in this Lambda. A new closure per call
// would defeat unstable_cache deduplication (it keys partly on function identity).
// Per-slug tags are preserved so revalidateTag(getResourceCacheTag(slug)) still works.
type CachedFn<T> = () => Promise<T>;
const _resourceDetailCacheMap = new Map<string, CachedFn<Awaited<ReturnType<typeof findPublicResourceDetailShellBySlug>>>>();
const _resourceMetadataCacheMap = new Map<string, CachedFn<Awaited<ReturnType<typeof findPublicResourceDetailMetadataBySlug>>>>();
const _resourcePurchaseMetaCacheMap = new Map<string, CachedFn<Awaited<ReturnType<typeof findPublicResourceDetailPurchaseMetaBySlug>>>>();
const _resourceDetailBodyContentCacheMap = new Map<string, CachedFn<Awaited<ReturnType<typeof findPublicResourceDetailBodyContentBySlug>>>>();
const _resourceDetailFooterContentCacheMap = new Map<string, CachedFn<Awaited<ReturnType<typeof findPublicResourceDetailFooterContentBySlug>>>>();

/** Returns the public detail shell data by slug, or null if not found. */
export async function getResourceBySlug(slug: string) {
  recordCacheCall("getResourceBySlug", { slug });

  let cachedFn = _resourceDetailCacheMap.get(slug);
  if (!cachedFn) {
    const singleFlightKey = `resource-detail:${slug}`;
    cachedFn = unstable_cache(
      async function _getResourceBySlug() {
        recordCacheMiss("getResourceBySlug", { slug });
        logPerformanceEvent("cache_execute:getResourceBySlug", { slug });
        // rememberJson adds a Redis cross-instance layer on top of unstable_cache.
        // Cold Vercel lambda instances return the cached resource shell in <10 ms
        // instead of running the full DB fetch. Only public, non-user-specific
        // shell data is stored here — title, pricing, author, category, previews,
        // and the stats needed above the fold.
        return rememberJson(
          CACHE_KEYS.resourceDetail(slug),
          RESOURCE_DETAIL_REVALIDATE_SECONDS,
          () => runSingleFlight(singleFlightKey, () =>
            findPublicResourceDetailShellBySlug(slug),
          ),
          { metricName: "resource.getResourceBySlug", details: { slug } },
        );
      },
      ["public-resource-detail", slug],
      {
        revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
        tags: [getResourceCacheTag(slug)],
      },
    );
    _resourceDetailCacheMap.set(slug, cachedFn);
  }

  return cachedFn();
}

export async function getResourceMetadataBySlug(slug: string) {
  recordCacheCall("getResourceMetadataBySlug", { slug });

  let cachedFn = _resourceMetadataCacheMap.get(slug);
  if (!cachedFn) {
    const singleFlightKey = `resource-metadata:${slug}`;
    cachedFn = unstable_cache(
      async function _getResourceMetadataBySlug() {
        recordCacheMiss("getResourceMetadataBySlug", { slug });
        logPerformanceEvent("cache_execute:getResourceMetadataBySlug", {
          slug,
        });
        return rememberJson(
          CACHE_KEYS.resourceMetadata(slug),
          RESOURCE_DETAIL_REVALIDATE_SECONDS,
          () =>
            runSingleFlight(singleFlightKey, () =>
              findPublicResourceDetailMetadataBySlug(slug),
            ),
          {
            metricName: "resource.metadata",
            details: { slug },
          },
        );
      },
      ["public-resource-detail-metadata", slug],
      {
        revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
        tags: [getResourceCacheTag(slug)],
      },
    );
    _resourceMetadataCacheMap.set(slug, cachedFn);
  }

  return cachedFn();
}

export async function getResourceDetailPurchaseMetaBySlug(slug: string) {
  recordCacheCall("getResourceDetailPurchaseMetaBySlug", { slug });

  let cachedFn = _resourcePurchaseMetaCacheMap.get(slug);
  if (!cachedFn) {
    const singleFlightKey = `resource-purchase-meta:${slug}`;
    cachedFn = unstable_cache(
      async function _getResourceDetailPurchaseMetaBySlug() {
        recordCacheMiss("getResourceDetailPurchaseMetaBySlug", { slug });
        logPerformanceEvent("cache_execute:getResourceDetailPurchaseMetaBySlug", {
          slug,
        });
        return rememberJson(
          CACHE_KEYS.resourcePurchaseMeta(slug),
          RESOURCE_DETAIL_REVALIDATE_SECONDS,
          () =>
            runSingleFlight(singleFlightKey, () =>
              findPublicResourceDetailPurchaseMetaBySlug(slug),
            ),
          {
            metricName: "resource.purchaseMeta",
            details: { slug },
          },
        );
      },
      ["public-resource-detail-purchase-meta", slug],
      {
        revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
        tags: [getResourceCacheTag(slug)],
      },
    );
    _resourcePurchaseMetaCacheMap.set(slug, cachedFn);
  }

  return cachedFn();
}

async function _getResourceDetailBodyContent(slug: string) {
  recordCacheCall("getResourceDetailBodyContent", { slug });
  const singleFlightKey = `resource-detail-body:${slug}`;

  let cachedFn = _resourceDetailBodyContentCacheMap.get(slug);
  if (!cachedFn) {
    cachedFn = unstable_cache(
      async function __getResourceDetailBodyContent() {
        recordCacheMiss("getResourceDetailBodyContent", { slug });
        logPerformanceEvent("cache_execute:getResourceDetailBodyContent", {
          slug,
        });
        return rememberJson(
          CACHE_KEYS.resourceBodyContent(slug),
          RESOURCE_DETAIL_REVALIDATE_SECONDS,
          () =>
            runSingleFlight(singleFlightKey, () =>
              findPublicResourceDetailBodyContentBySlug(slug),
            ),
          {
            metricName: "resource.bodyContent",
            details: { slug },
          },
        );
      },
      ["public-resource-detail-body", slug],
      {
        revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
        tags: [getResourceCacheTag(slug)],
      },
    );
    _resourceDetailBodyContentCacheMap.set(slug, cachedFn);
  }

  return cachedFn();
}

export const getResourceDetailBodyContent = cache(_getResourceDetailBodyContent);

async function _getResourceDetailFooterContent(slug: string) {
  recordCacheCall("getResourceDetailFooterContent", { slug });
  const singleFlightKey = `resource-detail-footer:${slug}`;

  let cachedFn = _resourceDetailFooterContentCacheMap.get(slug);
  if (!cachedFn) {
    cachedFn = unstable_cache(
      async function __getResourceDetailFooterContent() {
        recordCacheMiss("getResourceDetailFooterContent", { slug });
        logPerformanceEvent("cache_execute:getResourceDetailFooterContent", {
          slug,
        });
        return rememberJson(
          CACHE_KEYS.resourceFooterContent(slug),
          RESOURCE_DETAIL_REVALIDATE_SECONDS,
          () =>
            runSingleFlight(singleFlightKey, () =>
              findPublicResourceDetailFooterContentBySlug(slug),
            ),
          {
            metricName: "resource.footerContent",
            details: { slug },
          },
        );
      },
      ["public-resource-detail-footer", slug],
      {
        revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
        tags: [getResourceCacheTag(slug)],
      },
    );
    _resourceDetailFooterContentCacheMap.set(slug, cachedFn);
  }

  return cachedFn();
}

export const getResourceDetailFooterContent = cache(_getResourceDetailFooterContent);

/** Returns related resources in the same category (excludes the current resource). */
export async function getRelatedResources(
  categoryId: string,
  excludeId: string,
  take = 4,
): Promise<RelatedResourceCard[]> {
  recordCacheCall("getRelatedResources", {
    categoryId,
    excludeId,
    take,
  });
  const singleFlightKey = `resource-related:${categoryId}:${excludeId}:${take}`;

  return unstable_cache(
    async function _getRelatedResources() {
      recordCacheMiss("getRelatedResources", {
        categoryId,
        excludeId,
        take,
      });
      logPerformanceEvent("cache_execute:getRelatedResources", {
        categoryId,
        excludeId,
        take,
      });
      return rememberJson(
        CACHE_KEYS.relatedResources(categoryId, excludeId, take),
        CACHE_TTLS.homepageList,
        () =>
          runSingleFlight(singleFlightKey, async () => {
            const baseResources = (
              await findRelatedListedResources(categoryId, excludeId, take)
            ).map(withPreview);
            return baseResources;
          }),
        { metricName: "resource.related", details: { categoryId, excludeId, take } },
      );
    },
    ["resource-related", categoryId, excludeId, String(take)],
    {
      revalidate: CACHE_TTLS.homepageList,
      tags: [CACHE_TAGS.discover],
    },
  )();
}

function isResourceDetailPoolPressureError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Timed out fetching a new connection from the connection pool");
}

function getResourceDetailErrorSummary(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      code: error.code,
      message: error.message,
      name: error.name,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: String(error),
  };
}

export async function getPublicResourcePageData(slug: string) {
  recordCacheCall("getPublicResourcePageData", { slug });

  return unstable_cache(
    async function _getPublicResourcePageData() {
      recordCacheMiss("getPublicResourcePageData", { slug });
      logPerformanceEvent("cache_execute:getPublicResourcePageData", {
        slug,
      });
      const resource = await getResourceBySlug(slug);

      if (!resource || resource.status !== "PUBLISHED") {
        return {
          resource: null,
          relatedResources: [],
        };
      }

      let relatedResources: Awaited<ReturnType<typeof getRelatedResources>> = [];

      if (resource.categoryId) {
        try {
          relatedResources = await getRelatedResources(resource.categoryId, resource.id, 4);
        } catch (error) {
          if (!isResourceDetailPoolPressureError(error)) {
            throw error;
          }

          console.warn("[RESOURCE_DETAIL_RELATED_FALLBACK]", {
            slug,
            resourceId: resource.id,
            ...getResourceDetailErrorSummary(error),
          });
        }
      }

      return {
        resource,
        relatedResources,
      };
    },
    ["public-resource-page", slug],
    {
      revalidate: CACHE_TTLS.publicPage,
      tags: [getResourceCacheTag(slug)],
    },
  )();
}
