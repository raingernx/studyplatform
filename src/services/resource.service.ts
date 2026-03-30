/**
 * Resource Service
 *
 * Centralises Prisma queries that read Resource rows so that page components
 * and API routes stay free of raw DB logic.
 *
 * All public-facing functions apply LISTED_RESOURCE_WHERE automatically so
 * draft / archived / soft-deleted resources are never accidentally exposed.
 *
 * Discover-section queries live in `discover.service.ts` which uses the lean
 * RESOURCE_CARD_SELECT projection for maximum query efficiency.
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
import { DEFAULT_SORT, normaliseSortParam } from "@/config/sortOptions";
import {
  countMarketplaceResources,
  findActivationRankedResources,
  findCategoriesOrderedByName,
  findMarketplaceResourceCards,
  findPublicResourceDetailDeferredContentBySlug,
  findPublicResourceMetadataBySlug,
  findPublicResourceDetailBySlug,
  findRelatedListedResources,
  type FindActivationRankedResourcesRow,
} from "@/repositories/resources/resource.repository";
import { withPreview } from "@/services/discover.service";

// ── Re-export withPreview for callers that used the old import path ────────────
export { withPreview };

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
    sort: normaliseSortParam(filters.sort ?? DEFAULT_SORT),
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
      CACHE_TTLS.publicPage,
      () => findCategoriesOrderedByName(),
      { metricName: "marketplace.categories" },
    );
  },
  ["marketplace-categories"],
  {
    revalidate: CACHE_TTLS.publicPage,
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
  const categories = await getCachedMarketplaceCategories();
  const categoryId = category
    ? categories.find((c) => c.slug === category)?.id
    : undefined;

  if (category && !categoryId) {
    return {
      resources: [],
      total: 0,
      totalPages: 1,
      categories,
    };
  }

  // ── Activation-weighted "recommended" sort ─────────────────────────────────
  if (sort === "recommended") {
    const isFreeFilter =
      price === "free" ? true : price === "paid" ? false : undefined;

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

    const precomputedRecommendedListingCacheKey =
      getPrecomputedRecommendedListingCacheKey(filters);

    if (precomputedRecommendedListingCacheKey) {
      const loadRecommendedLanding = async () => {
        const { rows, total } = await loadRankedRows();
        return {
          resources: rows.map((row) => withPreview(toActivationRankedCardShape(row))),
          total,
        };
      };

      const { resources, total } = await rememberJson(
        precomputedRecommendedListingCacheKey,
        CACHE_TTLS.homepageList,
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
      );

      return {
        resources,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        categories,
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
    const { rows, total } = search
      ? await loadRankedRows()
      : await rememberJson(
          recommendedCacheKey,
          CACHE_TTLS.homepageList,
          () => runSingleFlight(recommendedCacheKey, loadRankedRows),
          {
            metricName: "marketplace.recommendedResources",
            details: { page, pageSize, categoryId: categoryId ?? "all" },
          },
        );

    // Recommended listing cards can render without trust metadata, so avoid
    // blocking the strict first render on batched review/sales enrichment.
    const resources = rows.map((row) => withPreview(toActivationRankedCardShape(row)));

    return {
      resources,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      categories,
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
    const newestCacheKey = [
      "marketplace:newest",
      categoryId ?? "all",
      tag ?? "none",
      price === "free" ? "free" : price === "paid" ? "paid" : "any",
      featured ? "1" : "0",
      page,
      pageSize,
    ].join(":");

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

    const { items: newestItems, count: newestTotal } = await rememberJson(
      newestCacheKey,
      CACHE_TTLS.publicPage,
      () => runSingleFlight(newestCacheKey, loadNewestRows),
      {
        metricName: "marketplace.newestResources",
        details: { page, pageSize, categoryId: categoryId ?? "all" },
      },
    );

    const resources = newestItems.map(withPreview);
    return {
      resources,
      total: newestTotal,
      totalPages: Math.max(1, Math.ceil(newestTotal / pageSize)),
      categories,
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

    const { items: sortedItems, count: sortedTotal } = await rememberJson(
      sortCacheKey,
      CACHE_TTLS.publicPage,
      () => runSingleFlight(sortCacheKey, loadSortRows),
      {
        metricName: "marketplace.sortedResources",
        details: { sort, page, pageSize, categoryId: categoryId ?? "all" },
      },
    );

    const resources = sortedItems.map(withPreview);
    return {
      resources,
      total: sortedTotal,
      totalPages: Math.max(1, Math.ceil(sortedTotal / pageSize)),
      categories,
    };
  }

  const [rawItems, total] = await Promise.all([
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
    categories,
  };
}

export async function getMarketplaceResources(filters: MarketplaceFilters) {
  const normalizedFilters = normalizeMarketplaceFilters(filters);
  const cacheKey = getMarketplaceCacheKey(normalizedFilters);
  const singleFlightKey = `marketplace:${normalizedFilters.sort}:${cacheKey}`;
  const revalidateSeconds =
    normalizedFilters.sort === "recommended"
      ? CACHE_TTLS.homepageList
      : CACHE_TTLS.publicPage;

  recordCacheCall("getMarketplaceResources", {
    cacheKey,
    category: normalizedFilters.category ?? "all",
    page: normalizedFilters.page,
    sort: normalizedFilters.sort,
  });

  // Search queries produce unique, one-off cache keys that are never reused.
  // Caching them via unstable_cache would grow the in-process cache without
  // bound. Bypass caching for search — the pg_trgm index makes the DB query
  // fast enough that caching provides no meaningful benefit here.
  if (normalizedFilters.search !== null) {
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

  return unstable_cache(
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
  )();
}

// ── Single resource detail ────────────────────────────────────────────────────

const RESOURCE_DETAIL_REVALIDATE_SECONDS = CACHE_TTLS.homepageList;

/** Returns a fully-hydrated Resource row by slug, or null if not found. */
export async function getResourceBySlug(slug: string) {
  recordCacheCall("getResourceBySlug", { slug });
  const singleFlightKey = `resource-detail:${slug}`;

  return unstable_cache(
    async function _getResourceBySlug() {
      recordCacheMiss("getResourceBySlug", { slug });
      logPerformanceEvent("cache_execute:getResourceBySlug", {
        slug,
      });
      // rememberJson adds a Redis cross-instance layer on top of unstable_cache.
      // Cold Vercel lambda instances return the cached resource in <10 ms instead
      // of running the full DB fetch.  Only public, non-user-specific data is
      // stored here — slug, title, price, author, category, previews, stats.
      return rememberJson(
        CACHE_KEYS.resourceDetail(slug),
        RESOURCE_DETAIL_REVALIDATE_SECONDS,
        () => runSingleFlight(singleFlightKey, () =>
          findPublicResourceDetailBySlug(slug),
        ),
        {
          metricName: "resource.getResourceBySlug",
          details: { slug },
        },
      );
    },
    ["public-resource-detail", slug],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceCacheTag(slug)],
    },
  )();
}

export async function getResourceMetadataBySlug(slug: string) {
  recordCacheCall("getResourceMetadataBySlug", { slug });
  const singleFlightKey = `resource-metadata:${slug}`;

  return unstable_cache(
    async function _getResourceMetadataBySlug() {
      recordCacheMiss("getResourceMetadataBySlug", { slug });
      logPerformanceEvent("cache_execute:getResourceMetadataBySlug", {
        slug,
      });
      try {
        return await rememberJson(
          CACHE_KEYS.resourceMetadata(slug),
          RESOURCE_DETAIL_REVALIDATE_SECONDS,
          () => runSingleFlight(singleFlightKey, () => findPublicResourceMetadataBySlug(slug)),
          { metricName: "resource.metadata", details: { slug } },
        );
      } catch (error) {
        if (!isResourceMetadataTransientDbError(error)) {
          throw error;
        }

        console.warn("[RESOURCE_METADATA_BEST_EFFORT]", error);
        return null;
      }
    },
    ["public-resource-metadata", slug],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceCacheTag(slug)],
    },
  )();
}

function isResourceMetadataTransientDbError(error: unknown) {
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

// Private implementation — unstable_cache + runSingleFlight as before.
async function _getResourceDetailDeferredContent(slug: string) {
  recordCacheCall("getResourceDetailDeferredContent", { slug });
  const singleFlightKey = `resource-detail-deferred:${slug}`;

  return unstable_cache(
    async function __getResourceDetailDeferredContent() {
      recordCacheMiss("getResourceDetailDeferredContent", { slug });
      logPerformanceEvent("cache_execute:getResourceDetailDeferredContent", {
        slug,
      });
      return runSingleFlight(singleFlightKey, () =>
        findPublicResourceDetailDeferredContentBySlug(slug),
      );
    },
    ["public-resource-detail-deferred", slug],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceCacheTag(slug)],
    },
  )();
}

// React.cache() adds per-request memoization on top of unstable_cache.
// ResourceDetailBodySection and ResourceDetailFooterSection both call this
// with the same slug in the same RSC render tree. The second call returns
// the already-resolving Promise without touching unstable_cache or the DB.
export const getResourceDetailDeferredContent = cache(_getResourceDetailDeferredContent);

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
