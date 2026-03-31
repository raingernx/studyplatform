/**
 * Analytics Service
 *
 * Platform-wide metrics for the admin analytics dashboard.
 *
 * Separating analytics queries into a service keeps the admin page component
 * free of raw Prisma calls and makes the queries easy to cache or test.
 */

import { unstable_cache } from "next/cache";
import { CACHE_TTLS } from "@/lib/cache";
import { recordCacheCall, recordCacheMiss } from "@/lib/performance/observability";
import {
  findRecentCompletedPurchases,
  findRecentResources,
  findPlatformOverviewCounts,
  findPlatformTotals,
  findPlatformTotalsSince,
  findPlatformStatsSince,
  findTopResourcesByDownloads,
  reconcileResourceDownloadCounts,
} from "@/repositories/analytics/analytics.repository";

// ── Daily bucket helpers ──────────────────────────────────────────────────────

/** Returns the start-of-day (UTC midnight) for a Date. */
function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** Returns an array of Date objects (start-of-day UTC) for the last N days. */
function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    days.push(startOfDay(d));
  }
  return days;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyPoint {
  /** ISO date string e.g. "2026-03-15" */
  date:  string;
  value: number;
}

export interface TopResource {
  id:            string;
  title:         string;
  slug:          string;
  downloadCount: number;
  salesCount:    number;
  revenue:       number;
}

export interface PlatformMetrics {
  /** All-time totals */
  totalResources:  number;
  totalDownloads:  number;
  totalPurchases:  number;
  totalRevenue:    number;  // in smallest currency unit
  totalUsers:      number;

  /** 30-day snapshots */
  downloadsLast30Days:  number;
  purchasesLast30Days:  number;
  reveneuLast30Days:    number;
  newUsersLast30Days:   number;
  newResourcesLast30Days: number;

  /** Daily time-series for charts (last 30 days) */
  dailyDownloads: DailyPoint[];
  dailyRevenue:   DailyPoint[];
  dailyNewUsers:  DailyPoint[];

  /** Top resources by download count */
  topResources: TopResource[];
}

export interface AdminDashboardOverview {
  metrics: PlatformMetrics;
  recentPurchases: Awaited<ReturnType<typeof findRecentCompletedPurchases>>;
  recentResources: Awaited<ReturnType<typeof findRecentResources>>;
}

// ── Main function ─────────────────────────────────────────────────────────────

const readPlatformMetrics = unstable_cache(
  async function _getPlatformMetrics(): Promise<PlatformMetrics> {
    recordCacheMiss("getPlatformMetrics");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const days = lastNDays(30);

    const [
      overviewCounts,
      allTimeTotals,
      recentTotals,
      platformStats,
      topResourcesRaw,
    ] = await Promise.all([
      findPlatformOverviewCounts(),
      findPlatformTotals(),
      findPlatformTotalsSince(thirtyDaysAgo),
      findPlatformStatsSince(thirtyDaysAgo),
      findTopResourcesByDownloads(10),
    ]);

    const dlMap = new Map<string, number>();
    const revMap = new Map<string, number>();
    const uMap = new Map<string, number>();

    for (const day of days) {
      const key = day.toISOString().slice(0, 10);
      dlMap.set(key, 0);
      revMap.set(key, 0);
      uMap.set(key, 0);
    }

    for (const row of platformStats) {
      const key = startOfDay(row.date).toISOString().slice(0, 10);
      if (!dlMap.has(key)) continue;
      dlMap.set(key, row.totalDownloads);
      revMap.set(key, row.totalRevenue);
      uMap.set(key, row.newUsers);
    }

    const toPoints = (map: Map<string, number>): DailyPoint[] =>
      Array.from(map.entries()).map(([date, value]) => ({ date, value }));

    const topResources: TopResource[] = topResourcesRaw.map((row) => ({
      id: row.resource.id,
      title: row.resource.title,
      slug: row.resource.slug,
      downloadCount: row.downloads,
      salesCount: row.purchases,
      revenue: row.revenue,
    }));

    return {
      totalResources: overviewCounts.totalResources,
      totalDownloads: allTimeTotals.totalDownloads,
      totalPurchases: allTimeTotals.totalPurchases,
      totalRevenue: allTimeTotals.totalRevenue,
      totalUsers: overviewCounts.totalUsers,

      downloadsLast30Days: recentTotals.downloadsLast30Days,
      purchasesLast30Days: recentTotals.purchasesLast30Days,
      reveneuLast30Days: recentTotals.revenueLast30Days,
      newUsersLast30Days: recentTotals.newUsersLast30Days,
      newResourcesLast30Days: recentTotals.newResourcesLast30Days,

      dailyDownloads: toPoints(dlMap),
      dailyRevenue: toPoints(revMap),
      dailyNewUsers: toPoints(uMap),

      topResources,
    };
  },
  ["admin-platform-metrics"],
  { revalidate: CACHE_TTLS.stats },
);

/**
 * Fetches all platform metrics needed to render the admin analytics page.
 *
 * Uses parallel queries (Promise.all) so total latency equals the slowest
 * individual query.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  recordCacheCall("getPlatformMetrics");
  return readPlatformMetrics();
}

export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  const [metrics, recentPurchases, recentResources] = await Promise.all([
    getPlatformMetrics(),
    findRecentCompletedPurchases(10),
    findRecentResources(5),
  ]);

  return {
    metrics,
    recentPurchases,
    recentResources,
  };
}

export async function reconcileHistoricalDownloadCounts() {
  return reconcileResourceDownloadCounts();
}
