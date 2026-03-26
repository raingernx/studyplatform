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

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  CACHE_TAGS,
  CACHE_TTLS,
  getResourceCacheTag,
  runSingleFlight,
} from "@/lib/cache";
import {
  logPerformanceEvent,
  recordCacheCall,
  recordCacheMiss,
} from "@/lib/performance/observability";
import { DEFAULT_SORT, normaliseSortParam } from "@/config/sortOptions";
import {
  countMarketplaceResources,
  findActivationRankedResources,
  findCategoriesOrderedByName,
  findCategoryBySlug,
  findMarketplaceResourceCards,
  findPublicResourceDetailDeferredContentBySlug,
  findPublicResourceMetadataBySlug,
  findPublicResourceDetailBySlug,
  findRelatedListedResources,
  type FindActivationRankedResourcesRow,
} from "@/repositories/resources/resource.repository";
import { withPreview } from "@/services/discover.service";
import { attachResourceTrustSignals } from "@/services/review.service";

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
 * `withPreview` and `attachResourceTrustSignals` expect — identical to what
 * Prisma returns when using `RESOURCE_CARD_SELECT`.
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

async function getCachedMarketplaceCategories() {
  recordCacheCall("getMarketplaceCategories");

  return unstable_cache(
    async function _getMarketplaceCategories() {
      recordCacheMiss("getMarketplaceCategories");
      return findCategoriesOrderedByName();
    },
    ["marketplace-categories"],
    {
      revalidate: CACHE_TTLS.publicPage,
      tags: [CACHE_TAGS.discover],
    },
  )();
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

  const categoryId =
    category
      ? (await findCategoryBySlug(category))?.id
      : undefined;

  if (category && !categoryId) {
    const categories = await getCachedMarketplaceCategories();

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

    const [{ rows, total }, categories] = await Promise.all([
      findActivationRankedResources({
        categoryId,
        tagSlug:  tag ?? undefined,
        search:   search ?? undefined,
        isFree:   isFreeFilter,
        featured: featured || undefined,
        page,
        pageSize,
      }),
      getCachedMarketplaceCategories(),
    ]);

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

  const [rawItems, total, categories] = await Promise.all([
    findMarketplaceResourceCards({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    countMarketplaceResources(where),
    getCachedMarketplaceCategories(),
  ]);

  const resources = await attachResourceTrustSignals(rawItems.map(withPreview));

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
      return runSingleFlight(singleFlightKey, () =>
        findPublicResourceDetailBySlug(slug),
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
        return await runSingleFlight(singleFlightKey, () =>
          findPublicResourceMetadataBySlug(slug),
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

export async function getResourceDetailDeferredContent(slug: string) {
  recordCacheCall("getResourceDetailDeferredContent", { slug });
  const singleFlightKey = `resource-detail-deferred:${slug}`;

  return unstable_cache(
    async function _getResourceDetailDeferredContent() {
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
      return runSingleFlight(singleFlightKey, async () => {
        const baseResources = (await findRelatedListedResources(
          categoryId,
          excludeId,
          take,
        )).map(withPreview);

        return baseResources;
      });
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
