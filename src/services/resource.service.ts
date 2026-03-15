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

import { prisma } from "@/lib/prisma";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";
import { RESOURCE_CARD_WITH_TAGS_SELECT } from "@/lib/query/resourceSelect";
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
    case "popular":    return { downloadCount: "desc" } as const;
    case "price_asc":  return { price: "asc" }          as const;
    case "price_desc": return { price: "desc" }         as const;
    case "trending":   return [{ downloadCount: "desc" }, { purchases: { _count: "desc" } }] as const;
    // Internal / legacy — not exposed in the public sort UI
    case "oldest":     return { createdAt: "asc" }      as const;
    case "featured":   return [{ featured: "desc" }, { createdAt: "desc" }] as const;
    case "newest":
    default:           return { createdAt: "desc" }     as const;
  }
}

/**
 * Returns a paginated list of published resources matching the supplied
 * filters, together with the full category list for the filter sidebar.
 */
export async function getMarketplaceResources(filters: MarketplaceFilters) {
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

  const categoryWhere =
    trimmedCategory && trimmedCategory !== "all"
      ? { category: { slug: trimmedCategory } }
      : {};

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
      select:  RESOURCE_CARD_WITH_TAGS_SELECT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderBy: buildOrderBy(sort) as any,
      skip,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    resources:  rawItems.map(withPreview),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    categories,
  };
}

// ── Single resource detail ────────────────────────────────────────────────────

/** Returns a fully-hydrated Resource row by slug, or null if not found. */
export async function getResourceBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    include: {
      author:   { select: { id: true, name: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
      previews: { orderBy: { order: "asc" } },
      tags:     { include: { tag: { select: { name: true, slug: true } } } },
      reviews:  {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
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
    include: {
      author:   { select: { name: true } },
      category: { select: { name: true, slug: true } },
      previews: { orderBy: { order: "asc" }, select: { imageUrl: true } },
    },
  });

  return raw.map(withPreview);
}
