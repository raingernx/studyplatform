/**
 * Analytics Service
 *
 * Platform-wide metrics for the admin analytics dashboard.
 *
 * Separating analytics queries into a service keeps the admin page component
 * free of raw Prisma calls and makes the queries easy to cache or test.
 */

import { prisma } from "@/lib/prisma";
import {
  findPlatformStatsSince,
  findTopResourcesByDownloads,
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

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Fetches all platform metrics needed to render the admin analytics page.
 *
 * Uses parallel queries (Promise.all) so total latency equals the slowest
 * individual query.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const days          = lastNDays(30);

  const [
    totalResources,
    totalUsers,
    platformStats,
    topResourcesRaw,
  ] = await Promise.all([
    prisma.resource.count({ where: { deletedAt: null } }),
    prisma.user.count(),
    findPlatformStatsSince(new Date(Date.UTC(2020, 0, 1))),
    findTopResourcesByDownloads(10),
  ]);

  // ── Aggregate daily series ─────────────────────────────────────────────────

  // Build date-keyed maps
  const dlMap  = new Map<string, number>();
  const revMap = new Map<string, number>();
  const uMap   = new Map<string, number>();

  // Initialise every bucket to 0
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

  // ── Top resources ──────────────────────────────────────────────────────────

  const topResources: TopResource[] = topResourcesRaw.map((row) => ({
    id: row.resource.id,
    title: row.resource.title,
    slug: row.resource.slug,
    downloadCount: row.downloads,
    salesCount: row.purchases,
    revenue: row.revenue,
  }));

  const totalDownloads = platformStats.reduce(
    (sum, row) => sum + row.totalDownloads,
    0,
  );
  const totalPurchases = platformStats.reduce(
    (sum, row) => sum + row.totalSales,
    0,
  );
  const totalRevenue = platformStats.reduce(
    (sum, row) => sum + row.totalRevenue,
    0,
  );
  const recentStats = platformStats.filter((row) => row.date >= thirtyDaysAgo);
  const downloadsLast30 = recentStats.reduce(
    (sum, row) => sum + row.totalDownloads,
    0,
  );
  const purchasesLast30 = recentStats.reduce(
    (sum, row) => sum + row.totalSales,
    0,
  );
  const revenueLast30 = recentStats.reduce(
    (sum, row) => sum + row.totalRevenue,
    0,
  );
  const newUsersLast30 = recentStats.reduce((sum, row) => sum + row.newUsers, 0);
  const newResourcesLast30 = recentStats.reduce(
    (sum, row) => sum + row.newResources,
    0,
  );

  return {
    totalResources,
    totalDownloads,
    totalPurchases,
    totalRevenue,
    totalUsers,

    downloadsLast30Days:    downloadsLast30,
    purchasesLast30Days:    purchasesLast30,
    reveneuLast30Days:      revenueLast30,
    newUsersLast30Days:     newUsersLast30,
    newResourcesLast30Days: newResourcesLast30,

    dailyDownloads: toPoints(dlMap),
    dailyRevenue:   toPoints(revMap),
    dailyNewUsers:  toPoints(uMap),

    topResources,
  };
}
