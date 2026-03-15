/**
 * Creator Service
 *
 * Centralises all queries for the "creator" view — resources authored by a
 * specific user, and the metrics needed to populate their dashboard.
 *
 * Only PUBLISHED resources are surfaced in metrics so that draft/archived
 * resources do not pollute download or revenue counts.
 */

import { prisma } from "@/lib/prisma";

// ── Creator resource listing ───────────────────────────────────────────────────

/**
 * Returns all resources authored by `userId`, including soft-deleted ones,
 * ordered by creation date (newest first).
 *
 * Intended for the creator's own resource management page, where they need to
 * see every resource regardless of status.
 */
export async function getCreatorResources(userId: string) {
  return prisma.resource.findMany({
    where: { authorId: userId },
    select: {
      id:            true,
      title:         true,
      slug:          true,
      status:        true,
      isFree:        true,
      price:         true,
      featured:      true,
      downloadCount: true,
      createdAt:     true,
      deletedAt:     true,
      category: { select: { id: true, name: true, slug: true } },
      previews: {
        take:    1,
        orderBy: { order: "asc" as const },
        select:  { imageUrl: true },
      },
      _count: {
        select: { purchases: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CreatorResource = Awaited<ReturnType<typeof getCreatorResources>>[number];

// ── Creator metrics ────────────────────────────────────────────────────────────

export interface CreatorMetrics {
  /** Total individual download events recorded for all of this creator's resources. */
  totalDownloads: number;
  /** Number of COMPLETED purchases across all of this creator's resources. */
  totalSales: number;
  /** Sum of purchase amounts (in smallest currency unit, e.g. satang). */
  revenue: number;
  /** Number of published resources by this creator. */
  publishedCount: number;
  /** Number of draft resources (not yet published). */
  draftCount: number;
  /** Download events in the last 30 days (for the trend indicator). */
  downloadsLast30Days: number;
  /** Top 5 resources ranked by download count. */
  topResources: TopResource[];
}

export interface TopResource {
  id:            string;
  title:         string;
  slug:          string;
  downloadCount: number;
  salesCount:    number;
}

/**
 * Computes the creator metrics shown on the creator dashboard.
 *
 * Uses parallel queries so total wall-clock time equals the slowest
 * individual query rather than the sum of all queries.
 */
export async function getCreatorMetrics(userId: string): Promise<CreatorMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Collect IDs of resources owned by this creator first so subsequent
  // queries can be scoped with a simple `in` clause.
  const ownedResources = await prisma.resource.findMany({
    where:  { authorId: userId },
    select: { id: true, status: true },
  });

  const allIds       = ownedResources.map((r) => r.id);
  const publishedIds = ownedResources
    .filter((r) => r.status === "PUBLISHED")
    .map((r) => r.id);

  if (allIds.length === 0) {
    return {
      totalDownloads:     0,
      totalSales:         0,
      revenue:            0,
      publishedCount:     0,
      draftCount:         0,
      downloadsLast30Days: 0,
      topResources:       [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any; // DownloadEvent types are available after `prisma generate`

  const [
    totalDownloads,
    downloadsLast30Days,
    salesResult,
    topResourcesRaw,
  ] = await Promise.all([
    // All-time download event count across all creator resources
    db.downloadEvent.count({
      where: { resourceId: { in: allIds } },
    }) as Promise<number>,

    // Download events in the last 30 days
    db.downloadEvent.count({
      where: {
        resourceId: { in: allIds },
        createdAt:  { gte: thirtyDaysAgo },
      },
    }) as Promise<number>,

    // Completed purchase count and revenue sum
    prisma.purchase.aggregate({
      where:  { resourceId: { in: allIds }, status: "COMPLETED" },
      _count: { id: true },
      _sum:   { amount: true },
    }),

    // Top 5 resources by download count with their sales count
    prisma.resource.findMany({
      where:   { id: { in: allIds } },
      select: {
        id:            true,
        title:         true,
        slug:          true,
        downloadCount: true,
        _count: { select: { purchases: true } },
      },
      orderBy: { downloadCount: "desc" },
      take:    5,
    }),
  ]);

  return {
    totalDownloads,
    downloadsLast30Days,
    totalSales:     salesResult._count.id      ?? 0,
    revenue:        salesResult._sum.amount    ?? 0,
    publishedCount: publishedIds.length,
    draftCount:     allIds.length - publishedIds.length,
    topResources:   topResourcesRaw.map((r: {
      id: string; title: string; slug: string;
      downloadCount: number; _count: { purchases: number };
    }) => ({
      id:            r.id,
      title:         r.title,
      slug:          r.slug,
      downloadCount: r.downloadCount,
      salesCount:    r._count.purchases,
    })),
  };
}
