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

import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_TTLS } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";
import { RESOURCE_CARD_SELECT } from "@/lib/query/resourceSelect";
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

const RESOURCE_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  type: true,
  status: true,
  featured: true,
  level: true,
  isFree: true,
  price: true,
  downloadCount: true,
  categoryId: true,
  fileSize: true,
  fileName: true,
  fileUrl: true,
  fileKey: true,
  mimeType: true,
  updatedAt: true,
  previewUrl: true,
  author: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  previews: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      imageUrl: true,
      order: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  resourceStat: {
    select: {
      downloads: true,
      purchases: true,
      last30dDownloads: true,
      last30dPurchases: true,
      trendingScore: true,
    },
  },
} as const;

const RELATED_RESOURCE_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  isFree: true,
  featured: true,
  downloadCount: true,
  createdAt: true,
  previewUrl: true,
  author: {
    select: {
      name: true,
    },
  },
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  previews: {
    orderBy: { order: "asc" as const },
    select: {
      imageUrl: true,
    },
  },
} as const;

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
async function loadMarketplaceResources(filters: MarketplaceFilters) {
  const {
    search,
    category,
    price,
    featured,
    tag,
    sort     = "newest",
    page     = 1,
    pageSize = 20,
  } = filters;

  const trimmedSearch   = search?.trim();
  const trimmedCategory = category?.trim();
  const trimmedTag      = tag?.trim();

  const searchWhere = trimmedSearch
    ? {
        OR: [
          { title:       { contains: trimmedSearch, mode: "insensitive" as const } },
          { description: { contains: trimmedSearch, mode: "insensitive" as const } },
        ],
      }
    : {};

  const categoryId =
    trimmedCategory && trimmedCategory !== "all"
      ? (
          await prisma.category.findUnique({
            where: { slug: trimmedCategory },
            select: { id: true },
          })
        )?.id
      : undefined;

  if (trimmedCategory && trimmedCategory !== "all" && !categoryId) {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    return {
      resources: [],
      total: 0,
      totalPages: 1,
      categories,
    };
  }

  const categoryWhere = categoryId ? { categoryId } : {};

  const priceWhere =
    price === "free" ? { isFree: true } : price === "paid" ? { isFree: false } : {};

  const featuredWhere = featured ? { featured: true } : {};

  const tagWhere = trimmedTag
    ? { tags: { some: { tag: { slug: trimmedTag } } } }
    : {};

  const where = {
    ...LISTED_RESOURCE_WHERE,
    ...searchWhere,
    ...categoryWhere,
    ...priceWhere,
    ...featuredWhere,
    ...tagWhere,
  };

  const skip = (page - 1) * pageSize;

  const [rawItems, total, categories] = await Promise.all([
    prisma.resource.findMany({
      where,
      select: RESOURCE_CARD_SELECT,
      orderBy: buildOrderBy(sort) as any,
      skip,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const resources = await attachResourceTrustSignals(rawItems.map(withPreview));

  return {
    resources,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    categories,
  };
}

export const getMarketplaceResources = unstable_cache(
  async function _getMarketplaceResources(filters: MarketplaceFilters) {
    return loadMarketplaceResources(filters);
  },
  ["marketplace-resources"],
  {
    revalidate: CACHE_TTLS.publicPage,
    tags: [CACHE_TAGS.discover],
  },
);

// ── Single resource detail ────────────────────────────────────────────────────

/** Returns a fully-hydrated Resource row by slug, or null if not found. */
export async function getResourceBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    select: RESOURCE_DETAIL_SELECT,
  });
}

/** Returns related resources in the same category (excludes the current resource). */
export async function getRelatedResources(categoryId: string, excludeId: string, take = 4) {
  const raw = await prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId,
      id: { not: excludeId },
    },
    take,
    select: RELATED_RESOURCE_SELECT,
  });

  return attachResourceTrustSignals(raw.map(withPreview));
}

export const getPublicResourcePageData = unstable_cache(
  async function _getPublicResourcePageData(slug: string) {
    const resource = await getResourceBySlug(slug);

    if (!resource || resource.status !== "PUBLISHED") {
      return {
        resource: null,
        relatedResources: [],
      };
    }

    const relatedResources = resource.categoryId
      ? await getRelatedResources(resource.categoryId, resource.id, 4)
      : [];

    return {
      resource,
      relatedResources,
    };
  },
  ["public-resource-page"],
  {
    revalidate: CACHE_TTLS.publicPage,
    tags: [CACHE_TAGS.discover],
  },
);
