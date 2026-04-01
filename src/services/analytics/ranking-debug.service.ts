/**
 * Ranking Debug Service
 *
 * Provides the data behind the admin ranking observability page at
 * /admin/analytics/ranking.
 *
 * Design invariants:
 *   - Read-only. No writes, no mutations.
 *   - Never called from production marketplace paths — kept entirely
 *     separate from `findActivationRankedResources`.
 *   - Returns all score components so the page can render full
 *     breakdowns without any additional computation.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  findRankingDebugRows,
  type RankingDebugRow,
} from "@/repositories/resources/resource.repository";
import { CACHE_TTLS, rememberJson, runSingleFlight } from "@/lib/cache";
import { recordCacheCall, recordCacheMiss } from "@/lib/performance/observability";

export interface RankingDebugFilters {
  /** Category slug (from query param). */
  category?: string;
  search?: string;
  /** "free" | "paid" | undefined */
  price?: string;
}

export interface RankingDebugCategory {
  id: string;
  name: string;
  slug: string;
}

export interface RankingDebugReport {
  rows: RankingDebugRow[];
  categories: RankingDebugCategory[];
  /** Active filter values — echoed back for UI state. */
  filters: RankingDebugFilters;
  /** ISO timestamp for the "generated at" footer. */
  generatedAt: string;
  /** Maximum score in this result set — used for proportional bar widths. */
  maxScore: number;
}

export async function getRankingDebugReport(
  filters: RankingDebugFilters,
): Promise<RankingDebugReport> {
  const { category, search, price } = filters;
  const normalizedCategory = category?.trim() || "";
  const normalizedSearch = search?.trim() || "";
  const normalizedPrice = price?.trim() || "";

  const isFreeFilter =
    normalizedPrice === "free"
      ? true
      : normalizedPrice === "paid"
        ? false
        : undefined;

  recordCacheCall("getRankingDebugReport", {
    category: normalizedCategory || "all",
    hasSearch: Boolean(normalizedSearch),
    price: normalizedPrice || "all",
  });

  return unstable_cache(
    async function _getRankingDebugReport() {
      recordCacheMiss("getRankingDebugReport", {
        category: normalizedCategory || "all",
        hasSearch: Boolean(normalizedSearch),
        price: normalizedPrice || "all",
      });

      const cacheKey = [
        "admin-ranking-debug",
        normalizedCategory || "all",
        encodeURIComponent(normalizedSearch),
        normalizedPrice || "all",
      ].join(":");

      return rememberJson(
        cacheKey,
        CACHE_TTLS.publicPage,
        () =>
          runSingleFlight(cacheKey, async () => {
            const categoryIdPromise =
              normalizedCategory && normalizedCategory !== "all"
                ? prisma.category
                    .findUnique({
                      where: { slug: normalizedCategory },
                      select: { id: true },
                    })
                    .then((row) => row?.id)
                : Promise.resolve(undefined);
            const categoriesPromise = prisma.category.findMany({
              select: { id: true, name: true, slug: true },
              orderBy: { name: "asc" },
            });
            const categoryId = await categoryIdPromise;
            const [rows, categories] = await Promise.all([
              findRankingDebugRows({
                categoryId,
                search: normalizedSearch || undefined,
                isFree: isFreeFilter,
                limit: 50,
              }),
              categoriesPromise,
            ]);

            const maxScore = rows.length > 0 ? Math.max(...rows.map((r) => r.score)) : 1;

            return {
              rows,
              categories,
              filters: {
                category: normalizedCategory || undefined,
                search: normalizedSearch || undefined,
                price: normalizedPrice || undefined,
              },
              generatedAt: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
              maxScore,
            };
          }),
        {
          metricName: "getRankingDebugReport",
          details: {
            category: normalizedCategory || "all",
            hasSearch: Boolean(normalizedSearch),
            price: normalizedPrice || "all",
          },
        },
      );
    },
    [
      "admin-ranking-debug",
      normalizedCategory || "all",
      normalizedSearch,
      normalizedPrice || "all",
    ],
    { revalidate: CACHE_TTLS.publicPage },
  )();
}
