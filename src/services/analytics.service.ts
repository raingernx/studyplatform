/**
 * Analytics Service
 *
 * Platform-wide metrics for the admin analytics dashboard.
 *
 * Separating analytics queries into a service keeps the admin page component
 * free of raw Prisma calls and makes the queries easy to cache or test.
 */

import { prisma } from "@/lib/prisma";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any; // DownloadEvent types available after `prisma generate`

  const [
    totalResources,
    totalUsers,
    downloadAggregate,
    purchaseAggregate,
    downloadsLast30,
    purchasesLast30Result,
    newUsersLast30,
    newResourcesLast30,
    dailyDownloadEvents,
    dailyPurchaseEvents,
    dailyUserEvents,
    topResourcesRaw,
  ] = await Promise.all([
    // Scalar counts
    prisma.resource.count({ where: { deletedAt: null } }),
    prisma.user.count(),

    // All-time download count (aggregate on counter column — no DownloadEvent scan needed)
    prisma.resource.aggregate({ _sum: { downloadCount: true } }),

    // All-time purchase revenue
    prisma.purchase.aggregate({
      where: { status: "COMPLETED" },
      _count: { id: true },
      _sum:   { amount: true },
    }),

    // Downloads last 30 days (from DownloadEvent — granular)
    db.downloadEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }) as Promise<number>,

    // Purchases last 30 days
    prisma.purchase.aggregate({
      where:  { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _sum:   { amount: true },
    }),

    // New users last 30 days
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    // New resources last 30 days
    prisma.resource.count({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
    }),

    // Daily download events (raw rows, grouped in JS)
    db.downloadEvent.findMany({
      where:  { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }) as Promise<{ createdAt: Date }[]>,

    // Daily purchase events
    prisma.purchase.findMany({
      where:  { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, amount: true },
    }),

    // Daily user signups
    prisma.user.findMany({
      where:  { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),

    // Top 10 resources
    prisma.resource.findMany({
      where:   { deletedAt: null, status: "PUBLISHED" },
      select: {
        id:            true,
        title:         true,
        slug:          true,
        downloadCount: true,
        _count: { select: { purchases: true } },
        purchases: {
          where:  { status: "COMPLETED" },
          select: { amount: true },
        },
      },
      orderBy: { downloadCount: "desc" },
      take:    10,
    }),
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

  for (const e of dailyDownloadEvents) {
    const key = startOfDay(e.createdAt).toISOString().slice(0, 10);
    dlMap.set(key, (dlMap.get(key) ?? 0) + 1);
  }

  for (const p of dailyPurchaseEvents) {
    const key = startOfDay(p.createdAt).toISOString().slice(0, 10);
    revMap.set(key, (revMap.get(key) ?? 0) + p.amount);
  }

  for (const u of dailyUserEvents) {
    const key = startOfDay(u.createdAt).toISOString().slice(0, 10);
    uMap.set(key, (uMap.get(key) ?? 0) + 1);
  }

  const toPoints = (map: Map<string, number>): DailyPoint[] =>
    Array.from(map.entries()).map(([date, value]) => ({ date, value }));

  // ── Top resources ──────────────────────────────────────────────────────────

  const topResources: TopResource[] = topResourcesRaw.map((r: {
    id: string; title: string; slug: string; downloadCount: number;
    _count: { purchases: number }; purchases: { amount: number }[];
  }) => ({
    id:            r.id,
    title:         r.title,
    slug:          r.slug,
    downloadCount: r.downloadCount,
    salesCount:    r._count.purchases,
    revenue:       r.purchases.reduce((s: number, p: { amount: number }) => s + p.amount, 0),
  }));

  return {
    totalResources,
    totalDownloads:  downloadAggregate._sum.downloadCount ?? 0,
    totalPurchases:  purchaseAggregate._count.id ?? 0,
    totalRevenue:    purchaseAggregate._sum.amount ?? 0,
    totalUsers,

    downloadsLast30Days:    downloadsLast30,
    purchasesLast30Days:    purchasesLast30Result._count.id    ?? 0,
    reveneuLast30Days:      purchasesLast30Result._sum.amount  ?? 0,
    newUsersLast30Days:     newUsersLast30,
    newResourcesLast30Days: newResourcesLast30,

    dailyDownloads: toPoints(dlMap),
    dailyRevenue:   toPoints(revMap),
    dailyNewUsers:  toPoints(uMap),

    topResources,
  };
}
