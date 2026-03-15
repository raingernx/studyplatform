/**
 * Discover Service
 *
 * Owns every query the Discover home page needs.
 * Using Prisma `select` (via RESOURCE_CARD_SELECT) instead of `include` so
 * Postgres never sends columns the card UI doesn't render.
 *
 * This is the canonical discover data layer.  The page component should
 * import from here and contain no database logic of its own.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";
import { RESOURCE_CARD_SELECT } from "@/lib/query/resourceSelect";

// ── Preview normaliser ────────────────────────────────────────────────────────

/**
 * Promotes `previews[0].imageUrl` into a top-level `previewUrl` field so that
 * card components can read a single consistent property regardless of whether
 * the result came from the `previewUrl` DB column or the `previews` relation.
 *
 * When `RESOURCE_CARD_SELECT` is used (column not selected), `r.previewUrl` is
 * absent — the chain falls back to the relation value automatically.
 * When older `include`-based queries return the column, it takes priority.
 */
export function withPreview<
  T extends { previewUrl?: string | null; previews?: { imageUrl: string }[] }
>(r: T): T & { previewUrl: string | null } {
  return {
    ...r,
    previewUrl: r.previewUrl ?? r.previews?.[0]?.imageUrl ?? null,
  };
}

// ── Discover sections ─────────────────────────────────────────────────────────

/**
 * Fetches and returns the six curated sections shown on the Discover home.
 *
 * Wrapped with `unstable_cache` so the six parallel Prisma queries only hit
 * the database once every 120 seconds across all concurrent requests.
 * Immediately invalidated via `revalidateTag("discover")` whenever an admin
 * creates, updates, or archives a resource.
 *
 * The function has no request-scoped dependencies (no session, no params),
 * which is what makes the `unstable_cache` wrapper safe and effective.
 */
export const getDiscoverData = unstable_cache(
  async function _getDiscoverData() {
    // ── 2 queries total ────────────────────────────────────────────────────
    //
    // Query 1: a single wide resource pool that powers every section.
    // Query 2: categories for the discover navigation.
    //
    // All six sections are derived from the pool in memory — no per-section
    // DB round-trips, no expensive groupBy on DownloadEvent.
    //
    // Trending score = downloadCount + purchases * 3
    // This approximates recency-weighted popularity using columns that are
    // already returned by RESOURCE_CARD_SELECT, so no extra query is needed.

    const [pool, categories] = await Promise.all([
      // ── Query 1: resource pool ─────────────────────────────────────────
      // Order by featured → downloadCount → createdAt so the pool skews
      // toward high-signal resources across all section types.
      prisma.resource.findMany({
        where:   LISTED_RESOURCE_WHERE,
        select:  RESOURCE_CARD_SELECT,
        orderBy: [
          { featured:      "desc" },
          { downloadCount: "desc" },
          { createdAt:     "desc" },
        ],
        take: 40,
      }),

      // ── Query 2: categories ────────────────────────────────────────────
      prisma.category.findMany({
        include: { _count: { select: { resources: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    // ── Derive sections in memory ──────────────────────────────────────────
    //
    // Each section slices the pool with a different sort or filter.
    // `.slice()` is used after sort to avoid mutating the original array.

    // Trending: downloadCount + purchases*3 approximates purchase-weighted
    // momentum without hitting the DB for per-window event counts.
    const trending = pool
      .slice()
      .sort(
        (a, b) =>
          (b.downloadCount + b._count.purchases * 3) -
          (a.downloadCount + a._count.purchases * 3)
      )
      .slice(0, 4)
      .map(withPreview);

    // New releases: most recently published first.
    const newReleases = pool
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4)
      .map(withPreview);

    // Featured: admin-curated resources, sorted by download popularity.
    const featured = pool
      .filter((r) => r.featured)
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 4)
      .map(withPreview);

    // Free resources: isFree flag, sorted by popularity.
    const freeResources = pool
      .filter((r) => r.isFree)
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 4)
      .map(withPreview);

    // Most downloaded: all-time download count descending.
    const mostDownloaded = pool
      .slice()
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 4)
      .map(withPreview);

    // Recommended: newest resources the user may not have seen yet.
    const recommended = pool
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map(withPreview);

    return {
      trending,
      newReleases,
      featured,
      freeResources,
      mostDownloaded,
      recommended,
      categories,
    };
  },
  ["discover-data"],
  { revalidate: 120, tags: ["discover"] }
);

// ── Convenience type ──────────────────────────────────────────────────────────

export type DiscoverData = Awaited<ReturnType<typeof getDiscoverData>>;

// ── Supporting queries ────────────────────────────────────────────────────────

/**
 * Returns categories with their published-resource counts for the
 * "Browse by category" grid.
 *
 * Wrapped in its own unstable_cache entry (same "discover" tag) so that
 * callers outside of getDiscoverData — e.g. the marketplace page — never
 * incur an extra DB round-trip when the discover cache is warm.
 */
export const getDiscoverCategories = unstable_cache(
  async function _getDiscoverCategories() {
    return prisma.category.findMany({
      where:   { resources: { some: LISTED_RESOURCE_WHERE } },
      include: { _count: { select: { resources: true } } },
      orderBy: { name: "asc" },
    });
  },
  ["discover-categories"],
  { revalidate: 120, tags: ["discover"] }
);

/**
 * Returns the hero config used in discover mode.
 * Returns null when no HomepageHero record has been created.
 */
export async function getHeroConfig() {
  return prisma.homepageHero.findFirst({ orderBy: { createdAt: "asc" } });
}
