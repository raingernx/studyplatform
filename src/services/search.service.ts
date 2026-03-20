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
 * mode) rather than a dedicated search index.  It is fast enough for typical
 * catalogue sizes (<50k rows) and requires no extra infrastructure.
 * If the catalogue grows, this function can be replaced with a full-text or
 * vector search backend without touching the API or UI layers.
 */

import { prisma } from "@/lib/prisma";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";
import { withPreview } from "@/services/discover.service";

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
}

/**
 * Searches published resources matching `query`.
 *
 * Matches against:
 *   - resource title  (ILIKE)
 *   - resource description (ILIKE)
 *   - category name (ILIKE)
 *   - any tag name  (ILIKE)
 *
 * Returns at most `limit` results (default 20), ordered by cached ranking
 * signals before falling back to recency.
 * Returns an empty array when `query` is blank.
 */
export async function searchResources(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 20, category } = filters;

  const trimmed = query.trim();
  if (!trimmed) return [];

  const categoryWhere =
    category && category !== "all"
      ? { category: { slug: category } }
      : {};

  const raw = await prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      ...categoryWhere,
      OR: [
        { title:       { contains: trimmed, mode: "insensitive" as const } },
        { description: { contains: trimmed, mode: "insensitive" as const } },
        { category:    { name: { contains: trimmed, mode: "insensitive" as const } } },
        { tags: { some: { tag: { name: { contains: trimmed, mode: "insensitive" as const } } } } },
      ],
    },
    select: {
      id:            true,
      title:         true,
      slug:          true,
      price:         true,
      isFree:        true,
      downloadCount: true,
      category: { select: { id: true, name: true, slug: true } },
      author:   { select: { name: true } },
      previews: {
        take:    1,
        orderBy: { order: "asc" as const },
        select:  { imageUrl: true },
      },
      _count: { select: { purchases: true, reviews: true } },
    },
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
      { resourceStat: { downloads: "desc" } },
      { createdAt: "desc" },
    ] as any,
    take:    limit,
  });

  return raw.map(withPreview) as SearchResult[];
}
