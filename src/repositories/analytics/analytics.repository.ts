import { Prisma, type AnalyticsEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prismaErrors";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";

export interface CreateAnalyticsEventInput {
  eventType: AnalyticsEventType;
  userId?: string | null;
  resourceId?: string | null;
  creatorId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

export interface CreateCreatorRevenueInput {
  creatorId: string;
  resourceId: string;
  purchaseId: string;
  amount: number;
  platformFee: number;
  creatorShare: number;
}

export interface ResourceEventAggregateRow {
  resourceId: string;
  publishedAt: Date;
  views: number;
  downloads: number;
  last24hDownloads: number;
  last7dDownloads: number;
  last30dDownloads: number;
}

export interface ResourceRevenueAggregateRow {
  resourceId: string;
  purchases: number;
  revenue: number;
  last30dRevenue: number;
  last24hPurchases: number;
  last7dPurchases: number;
  last30dPurchases: number;
}

export interface ResourceRatingAggregateRow {
  resourceId: string;
  averageRating: number;
  reviewCount: number;
}

export interface TrendingResourceSignalRow {
  resourceId: string;
  publishedAt: Date;
  recentDownloads: number;
  recentSales: number;
  recentRevenue: number;
  averageRating: number;
  reviewCount: number;
}

export interface CreatorResourceCountRow {
  creatorId: string;
  resources: number;
}

export interface CreatorDownloadAggregateRow {
  creatorId: string;
  totalDownloads: number;
  last30dDownloads: number;
}

export interface CreatorRevenueAggregateRow {
  creatorId: string;
  totalSales: number;
  totalRevenue: number;
  last7dRevenue: number;
  last30dRevenue: number;
}

export interface PlatformCountRow {
  date: Date;
  total: number;
}

export interface PlatformRevenueRow {
  date: Date;
  totalSales: number;
  totalRevenue: number;
}

export interface PlatformOverviewCounts {
  totalResources: number;
  totalUsers: number;
}

export interface PlatformTotalsRow {
  totalDownloads: number;
  totalPurchases: number;
  totalRevenue: number;
}

export interface PlatformWindowTotalsRow {
  downloadsLast30Days: number;
  purchasesLast30Days: number;
  revenueLast30Days: number;
  newUsersLast30Days: number;
  newResourcesLast30Days: number;
}

export interface TopCreatorThisWeekRow {
  creatorId: string;
  resources: number;
  totalSales: number;
  last30dDownloads: number;
  last7dRevenue: number;
  creator: {
    name: string | null;
    image: string | null;
    creatorDisplayName: string | null;
    creatorSlug: string | null;
    creatorBio: string | null;
  };
}

export interface ReplaceResourceStatInput {
  resourceId: string;
  views: number;
  downloads: number;
  purchases: number;
  revenue: number;
  last24hDownloads: number;
  last7dDownloads: number;
  last30dDownloads: number;
  last24hPurchases: number;
  last7dPurchases: number;
  last30dPurchases: number;
  trendingScore: number;
}

export interface ReplaceCreatorStatInput {
  creatorId: string;
  resources: number;
  totalDownloads: number;
  last30dDownloads: number;
  totalSales: number;
  totalRevenue: number;
  last7dRevenue: number;
  last30dRevenue: number;
}

export interface UpsertPlatformStatInput {
  date: Date;
  totalDownloads: number;
  totalSales: number;
  totalRevenue: number;
  newUsers: number;
  newResources: number;
}

export async function createAnalyticsEvent(input: CreateAnalyticsEventInput) {
  return prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      userId: input.userId ?? null,
      resourceId: input.resourceId ?? null,
      creatorId: input.creatorId ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function createManyAnalyticsEvents(inputs: CreateAnalyticsEventInput[]) {
  if (inputs.length === 0) return;
  return prisma.analyticsEvent.createMany({
    data: inputs.map((input) => ({
      eventType: input.eventType,
      userId: input.userId ?? null,
      resourceId: input.resourceId ?? null,
      creatorId: input.creatorId ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
    })),
  });
}

export async function upsertCreatorRevenue(input: CreateCreatorRevenueInput) {
  return prisma.creatorRevenue.upsert({
    where: { purchaseId: input.purchaseId },
    update: {
      creatorId: input.creatorId,
      resourceId: input.resourceId,
      amount: input.amount,
      platformFee: input.platformFee,
      creatorShare: input.creatorShare,
    },
    create: {
      creatorId: input.creatorId,
      resourceId: input.resourceId,
      purchaseId: input.purchaseId,
      amount: input.amount,
      platformFee: input.platformFee,
      creatorShare: input.creatorShare,
    },
  });
}

export async function findPlatformOverviewCounts(): Promise<PlatformOverviewCounts> {
  const [totalResources, totalUsers] = await Promise.all([
    prisma.resource.count({ where: { deletedAt: null } }),
    prisma.user.count(),
  ]);

  return {
    totalResources,
    totalUsers,
  };
}

export async function findPlatformTotals(): Promise<PlatformTotalsRow> {
  const totals = await prisma.platformStat.aggregate({
    _sum: {
      totalDownloads: true,
      totalSales: true,
      totalRevenue: true,
    },
  });

  return {
    totalDownloads: totals._sum.totalDownloads ?? 0,
    totalPurchases: totals._sum.totalSales ?? 0,
    totalRevenue: totals._sum.totalRevenue ?? 0,
  };
}

export async function findPlatformTotalsSince(since: Date): Promise<PlatformWindowTotalsRow> {
  const totals = await prisma.platformStat.aggregate({
    where: {
      date: {
        gte: since,
      },
    },
    _sum: {
      totalDownloads: true,
      totalSales: true,
      totalRevenue: true,
      newUsers: true,
      newResources: true,
    },
  });

  return {
    downloadsLast30Days: totals._sum.totalDownloads ?? 0,
    purchasesLast30Days: totals._sum.totalSales ?? 0,
    revenueLast30Days: totals._sum.totalRevenue ?? 0,
    newUsersLast30Days: totals._sum.newUsers ?? 0,
    newResourcesLast30Days: totals._sum.newResources ?? 0,
  };
}

export async function fetchResourceEventAggregates(
  last24h: Date,
  last7d: Date,
  last30d: Date,
): Promise<ResourceEventAggregateRow[]> {
  return prisma.$queryRaw<ResourceEventAggregateRow[]>`
    SELECT
      r.id AS "resourceId",
      r."createdAt" AS "publishedAt",
      COUNT(*) FILTER (WHERE ae."eventType" = 'RESOURCE_VIEW')::int AS views,
      COUNT(*) FILTER (WHERE ae."eventType" = 'RESOURCE_DOWNLOAD')::int AS downloads,
      COUNT(*) FILTER (
        WHERE ae."eventType" = 'RESOURCE_DOWNLOAD'
          AND ae."createdAt" >= ${last24h}
      )::int AS "last24hDownloads",
      COUNT(*) FILTER (
        WHERE ae."eventType" = 'RESOURCE_DOWNLOAD'
          AND ae."createdAt" >= ${last7d}
      )::int AS "last7dDownloads",
      COUNT(*) FILTER (
        WHERE ae."eventType" = 'RESOURCE_DOWNLOAD'
          AND ae."createdAt" >= ${last30d}
      )::int AS "last30dDownloads"
    FROM "Resource" r
    LEFT JOIN "analytics_events" ae
      ON ae."resourceId" = r.id
    WHERE r."deletedAt" IS NULL
    GROUP BY r.id
  `;
}

export async function fetchResourceRevenueAggregates(
  last24h: Date,
  last7d: Date,
  last30d: Date,
): Promise<ResourceRevenueAggregateRow[]> {
  return prisma.$queryRaw<ResourceRevenueAggregateRow[]>`
    SELECT
      r.id AS "resourceId",
      COUNT(cr.id)::int AS purchases,
      COALESCE(SUM(cr.amount), 0)::int AS revenue,
      COALESCE(SUM(cr.amount) FILTER (WHERE cr."createdAt" >= ${last30d}), 0)::int AS "last30dRevenue",
      COUNT(cr.id) FILTER (WHERE cr."createdAt" >= ${last24h})::int AS "last24hPurchases",
      COUNT(cr.id) FILTER (WHERE cr."createdAt" >= ${last7d})::int AS "last7dPurchases",
      COUNT(cr.id) FILTER (WHERE cr."createdAt" >= ${last30d})::int AS "last30dPurchases"
    FROM "Resource" r
    LEFT JOIN "creator_revenue" cr
      ON cr."resourceId" = r.id
    WHERE r."deletedAt" IS NULL
    GROUP BY r.id
  `;
}

export async function fetchResourceRatingAggregates(): Promise<ResourceRatingAggregateRow[]> {
  return prisma.$queryRaw<ResourceRatingAggregateRow[]>`
    SELECT
      r.id AS "resourceId",
      COALESCE(AVG(rv.rating), 0)::double precision AS "averageRating",
      COUNT(rv.id)::int AS "reviewCount"
    FROM "Resource" r
    LEFT JOIN "Review" rv
      ON rv."resourceId" = r.id
      AND rv."isVisible" = true
    WHERE r."deletedAt" IS NULL
    GROUP BY r.id
  `;
}

export async function fetchCreatorResourceCounts(): Promise<CreatorResourceCountRow[]> {
  return prisma.$queryRaw<CreatorResourceCountRow[]>`
    SELECT
      r."authorId" AS "creatorId",
      COUNT(r.id)::int AS resources
    FROM "Resource" r
    WHERE r."deletedAt" IS NULL
    GROUP BY r."authorId"
  `;
}

export async function fetchCreatorDownloadAggregates(): Promise<CreatorDownloadAggregateRow[]> {
  return prisma.$queryRaw<CreatorDownloadAggregateRow[]>`
    SELECT
      r."authorId" AS "creatorId",
      COALESCE(SUM(rs.downloads), 0)::int AS "totalDownloads",
      COALESCE(SUM(rs."last30dDownloads"), 0)::int AS "last30dDownloads"
    FROM "Resource" r
    LEFT JOIN "resource_stats" rs
      ON rs."resourceId" = r.id
    WHERE r."deletedAt" IS NULL
    GROUP BY r."authorId"
  `;
}

export async function fetchCreatorRevenueAggregates(
  last7d: Date,
  last30d: Date,
): Promise<CreatorRevenueAggregateRow[]> {
  return prisma.$queryRaw<CreatorRevenueAggregateRow[]>`
    SELECT
      cr."creatorId" AS "creatorId",
      COUNT(cr.id)::int AS "totalSales",
      COALESCE(SUM(cr.amount), 0)::int AS "totalRevenue",
      COALESCE(SUM(cr.amount) FILTER (WHERE cr."createdAt" >= ${last7d}), 0)::int AS "last7dRevenue",
      COALESCE(SUM(cr.amount) FILTER (WHERE cr."createdAt" >= ${last30d}), 0)::int AS "last30dRevenue"
    FROM "creator_revenue" cr
    GROUP BY cr."creatorId"
  `;
}

export async function fetchPlatformDownloadRows(): Promise<PlatformCountRow[]> {
  return prisma.$queryRaw<PlatformCountRow[]>`
    SELECT
      DATE_TRUNC('day', ae."createdAt")::date AS date,
      COUNT(*)::int AS total
    FROM "analytics_events" ae
    WHERE ae."eventType" = 'RESOURCE_DOWNLOAD'
    GROUP BY DATE_TRUNC('day', ae."createdAt")::date
  `;
}

export async function fetchPlatformRevenueRows(): Promise<PlatformRevenueRow[]> {
  return prisma.$queryRaw<PlatformRevenueRow[]>`
    SELECT
      DATE_TRUNC('day', cr."createdAt")::date AS date,
      COUNT(cr.id)::int AS "totalSales",
      COALESCE(SUM(cr.amount), 0)::int AS "totalRevenue"
    FROM "creator_revenue" cr
    GROUP BY DATE_TRUNC('day', cr."createdAt")::date
  `;
}

export async function fetchPlatformNewUserRows(): Promise<PlatformCountRow[]> {
  return prisma.$queryRaw<PlatformCountRow[]>`
    SELECT
      DATE_TRUNC('day', u."createdAt")::date AS date,
      COUNT(u.id)::int AS total
    FROM "User" u
    GROUP BY DATE_TRUNC('day', u."createdAt")::date
  `;
}

export async function fetchPlatformNewResourceRows(): Promise<PlatformCountRow[]> {
  return prisma.$queryRaw<PlatformCountRow[]>`
    SELECT
      DATE_TRUNC('day', r."createdAt")::date AS date,
      COUNT(r.id)::int AS total
    FROM "Resource" r
    WHERE r."deletedAt" IS NULL
    GROUP BY DATE_TRUNC('day', r."createdAt")::date
  `;
}

export async function replaceResourceStats(rows: ReplaceResourceStatInput[]) {
  return prisma.$transaction(async (tx) => {
    await tx.resourceStat.deleteMany();
    if (rows.length > 0) {
      await tx.resourceStat.createMany({ data: rows });
    }
  });
}

export async function replaceCreatorStats(rows: ReplaceCreatorStatInput[]) {
  return prisma.$transaction(async (tx) => {
    await tx.creatorStat.deleteMany();
    if (rows.length > 0) {
      await tx.creatorStat.createMany({ data: rows });
    }
  });
}

export async function upsertPlatformStats(rows: UpsertPlatformStatInput[]) {
  return prisma.$transaction(
    rows.map((row) =>
      prisma.platformStat.upsert({
        where: { date: row.date },
        update: {
          totalDownloads: row.totalDownloads,
          totalSales: row.totalSales,
          totalRevenue: row.totalRevenue,
          newUsers: row.newUsers,
          newResources: row.newResources,
        },
        create: row,
      }),
    ),
  );
}

export async function findTopTrendingResourceIds(limit: number) {
  try {
    const rows = await prisma.resourceStat.findMany({
      select: { resourceId: true },
      orderBy: [{ trendingScore: "desc" }, { downloads: "desc" }],
      take: limit,
    });
    return rows.map((row) => row.resourceId);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findTrendingResourceSignals(
  since: Date,
  limit: number,
): Promise<TrendingResourceSignalRow[]> {
  try {
    return await prisma.$queryRaw<TrendingResourceSignalRow[]>`
    SELECT
      r.id AS "resourceId",
      r."createdAt" AS "publishedAt",
      COALESCE(d."recentDownloads", 0)::int AS "recentDownloads",
      COALESCE(p."recentSales", 0)::int AS "recentSales",
      COALESCE(p."recentRevenue", 0)::int AS "recentRevenue",
      COALESCE(rv."averageRating", 0)::double precision AS "averageRating",
      COALESCE(rv."reviewCount", 0)::int AS "reviewCount"
    FROM "Resource" r
    LEFT JOIN (
      SELECT
        de."resourceId",
        COUNT(*)::int AS "recentDownloads"
      FROM "DownloadEvent" de
      WHERE de."createdAt" >= ${since}
      GROUP BY de."resourceId"
    ) d
      ON d."resourceId" = r.id
    LEFT JOIN (
      SELECT
        p."resourceId",
        COUNT(*)::int AS "recentSales",
        COALESCE(SUM(COALESCE(p."authorRevenue", p.amount)), 0)::int AS "recentRevenue"
      FROM "Purchase" p
      WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= ${since}
      GROUP BY p."resourceId"
    ) p
      ON p."resourceId" = r.id
    LEFT JOIN (
      SELECT
        rv."resourceId",
        COALESCE(AVG(rv.rating), 0)::double precision AS "averageRating",
        COUNT(rv.id)::int AS "reviewCount"
      FROM "Review" rv
      WHERE rv."isVisible" = true
      GROUP BY rv."resourceId"
    ) rv
      ON rv."resourceId" = r.id
    WHERE r."deletedAt" IS NULL
      AND r.status = 'PUBLISHED'
      AND (r.visibility IS NULL OR r.visibility = 'PUBLIC')
      AND (
        COALESCE(d."recentDownloads", 0) > 0
        OR
        COALESCE(p."recentSales", 0) > 0
        OR COALESCE(p."recentRevenue", 0) > 0
        OR COALESCE(rv."reviewCount", 0) > 0
      )
    ORDER BY
      COALESCE(p."recentSales", 0) DESC,
      COALESCE(d."recentDownloads", 0) DESC,
      COALESCE(p."recentRevenue", 0) DESC,
      COALESCE(rv."averageRating", 0) DESC,
      COALESCE(rv."reviewCount", 0) DESC,
      r."createdAt" DESC
    LIMIT ${limit}
  `;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findTopDownloadedResourceIds(limit: number) {
  try {
    const rows = await prisma.resource.findMany({
      where: LISTED_RESOURCE_WHERE,
      select: { id: true },
      orderBy: [
        { resourceStat: { downloads: "desc" } },
        { resourceStat: { purchases: "desc" } },
        { resourceStat: { trendingScore: "desc" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });
    return rows.map((row) => row.id);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findNewestResourceIds(limit: number) {
  try {
    const rows = await prisma.resource.findMany({
      where: LISTED_RESOURCE_WHERE,
      select: { id: true },
      orderBy: [
        { createdAt: "desc" },
        { resourceStat: { trendingScore: "desc" } },
        { resourceStat: { purchases: "desc" } },
      ],
      take: limit,
    });
    return rows.map((row) => row.id);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findFeaturedResourceIds(limit: number) {
  try {
    const rows = await prisma.resource.findMany({
      where: {
        ...LISTED_RESOURCE_WHERE,
        featured: true,
      },
      select: { id: true },
      orderBy: [
        { resourceStat: { trendingScore: "desc" } },
        { resourceStat: { purchases: "desc" } },
        { resourceStat: { downloads: "desc" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });
    return rows.map((row) => row.id);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findFreeResourceIds(limit: number) {
  try {
    const rows = await prisma.resource.findMany({
      where: {
        ...LISTED_RESOURCE_WHERE,
        isFree: true,
      },
      select: { id: true },
      orderBy: [
        { resourceStat: { trendingScore: "desc" } },
        { resourceStat: { downloads: "desc" } },
        { resourceStat: { purchases: "desc" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });
    return rows.map((row) => row.id);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findResourceStatByResourceId(resourceId: string) {
  try {
    return await prisma.resourceStat.findUnique({
      where: { resourceId },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return null;
  }
}

export async function findCreatorStatByCreatorId(creatorId: string) {
  try {
    return await prisma.creatorStat.findUnique({
      where: { creatorId },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return null;
  }
}

export async function findTopCreatorThisWeek(): Promise<TopCreatorThisWeekRow | null> {
  try {
    return await prisma.creatorStat.findFirst({
      where: {
        resources: { gt: 0 },
        creator: {
          creatorStatus: "ACTIVE",
          creatorSlug: { not: null },
        },
        OR: [
          { last7dRevenue: { gt: 0 } },
          { last30dDownloads: { gt: 0 } },
          { totalSales: { gt: 0 } },
        ],
      },
      orderBy: [
        { last7dRevenue: "desc" },
        { last30dDownloads: "desc" },
        { totalSales: "desc" },
        { resources: "desc" },
      ],
      select: {
        creatorId: true,
        resources: true,
        totalSales: true,
        last30dDownloads: true,
        last7dRevenue: true,
        creator: {
          select: {
            name: true,
            image: true,
            creatorDisplayName: true,
            creatorSlug: true,
            creatorBio: true,
          },
        },
      },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return null;
  }
}

export async function findTopResourcesByDownloads(limit: number) {
  try {
    return await prisma.resourceStat.findMany({
      select: {
        resourceId: true,
        downloads: true,
        purchases: true,
        revenue: true,
        resource: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [{ downloads: "desc" }, { purchases: "desc" }],
      take: limit,
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return [];
  }
}

export async function findTopResourcesByCreator(
  creatorId: string,
  limit: number,
) {
  return prisma.resourceStat.findMany({
    where: {
      resource: {
        authorId: creatorId,
        deletedAt: null,
      },
    },
    select: {
      resourceId: true,
      downloads: true,
      purchases: true,
      revenue: true,
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: [{ downloads: "desc" }, { revenue: "desc" }],
    take: limit,
  });
}

export async function findRecentCompletedPurchases(limit: number) {
  return prisma.purchase.findMany({
    where: { status: "COMPLETED" },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      resource: {
        select: {
          title: true,
        },
      },
    },
  });
}

export async function findRecentResources(limit: number) {
  return prisma.resource.findMany({
    where: { deletedAt: null },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function reconcileResourceDownloadCounts() {
  return prisma.$transaction(async (tx) => {
    const resetCount = await tx.resource.updateMany({
      where: { downloadCount: { not: 0 } },
      data: { downloadCount: 0 },
    });

    const reconciledCount = await tx.$executeRaw`
      UPDATE "Resource" r
      SET "downloadCount" = counts.downloads
      FROM (
        SELECT "resourceId", COUNT(*)::int AS downloads
        FROM "DownloadEvent"
        GROUP BY "resourceId"
      ) counts
      WHERE r.id = counts."resourceId"
    `;

    return {
      resetCount,
      reconciledCount,
    };
  });
}

export async function findPlatformStatsSince(since: Date) {
  return prisma.platformStat.findMany({
    where: {
      date: {
        gte: since,
      },
    },
    orderBy: { date: "asc" },
  });
}

// ── Recommendation experiment reporting ───────────────────────────────────────

export interface RecommendationVariantMetricsRow {
  variant:     string;
  impressions: number;
  clicks:      number;
  uniqueUsers: number;
}

export interface RecommendationPurchaseRow {
  variant:             string;
  purchasesAfterClick: number;
}

/**
 * Aggregates impression and click counts (plus unique user reach) from
 * `analytics_events` rows where `metadata->>'experiment'` matches the given
 * experimentId, grouped by `metadata->>'variant'`.
 *
 * Rows are filtered to `createdAt >= since` so reports can be scoped to any
 * rolling window.
 */
export async function findRecommendationExperimentMetrics(
  experimentId: string,
  since: Date,
): Promise<RecommendationVariantMetricsRow[]> {
  return prisma.$queryRaw<RecommendationVariantMetricsRow[]>`
    SELECT
      metadata->>'variant' AS variant,
      COUNT(*) FILTER (
        WHERE metadata->>'source' = 'recommendation_impression'
      )::int AS impressions,
      COUNT(*) FILTER (
        WHERE metadata->>'source' = 'recommendation_click'
      )::int AS clicks,
      COUNT(DISTINCT "userId") FILTER (
        WHERE metadata->>'source' = 'recommendation_impression'
      )::int AS "uniqueUsers"
    FROM "analytics_events"
    WHERE metadata->>'experiment' = ${experimentId}
      AND "createdAt" >= ${since}
      AND (
        metadata->>'source' = 'recommendation_impression'
        OR metadata->>'source' = 'recommendation_click'
      )
    GROUP BY metadata->>'variant'
  `;
}

/**
 * For each variant, counts recommendation clicks that were followed by a
 * completed purchase of the same resource by the same user within 7 days.
 *
 * Uses `RESOURCE_PURCHASE` events for purchase detection so no extra tables
 * are required.  Only considers clicks from `createdAt >= since`.
 */
export async function findRecommendationPurchasesAfterClick(
  experimentId: string,
  since: Date,
): Promise<RecommendationPurchaseRow[]> {
  return prisma.$queryRaw<RecommendationPurchaseRow[]>`
    WITH clicks AS (
      SELECT
        "userId",
        "resourceId",
        "createdAt",
        metadata->>'variant' AS variant
      FROM "analytics_events"
      WHERE metadata->>'experiment' = ${experimentId}
        AND metadata->>'source'     = 'recommendation_click'
        AND "createdAt" >= ${since}
        AND "userId"     IS NOT NULL
        AND "resourceId" IS NOT NULL
    ),
    first_purchases AS (
      SELECT
        "userId",
        "resourceId",
        MIN("createdAt") AS "firstPurchaseAt"
      FROM "analytics_events"
      WHERE "eventType"  = 'RESOURCE_PURCHASE'
        AND "userId"     IS NOT NULL
        AND "resourceId" IS NOT NULL
      GROUP BY "userId", "resourceId"
    )
    SELECT
      c.variant,
      COUNT(*)::int AS "purchasesAfterClick"
    FROM clicks c
    INNER JOIN first_purchases fp
      ON  fp."userId"     = c."userId"
      AND fp."resourceId" = c."resourceId"
      AND fp."firstPurchaseAt" >= c."createdAt"
      AND fp."firstPurchaseAt" <= c."createdAt" + INTERVAL '7 days'
    GROUP BY c.variant
  `;
}

// ── Per-user behavior signals ─────────────────────────────────────────────────

export interface UserAnalyticsEventSignal {
  eventType: AnalyticsEventType;
  createdAt: Date;
  resource: {
    id: string;
    category: { id: string; name: string; slug: string } | null;
    tags: Array<{ tag: { id: string; slug: string } }>;
  } | null;
}

/**
 * Returns analytics events (VIEW, LIKE, BOOKMARK) for the given user since
 * the provided date.  Used by the Phase 2 behavior-based recommendation engine
 * to build a weighted interest profile.
 */
export async function findUserAnalyticsEventSignals(
  userId: string,
  since: Date,
): Promise<UserAnalyticsEventSignal[]> {
  return prisma.analyticsEvent.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      eventType: { in: ["RESOURCE_VIEW", "RESOURCE_LIKE", "RESOURCE_BOOKMARK"] },
      resourceId: { not: null },
    },
    select: {
      eventType: true,
      createdAt: true,
      resource: {
        select: {
          id: true,
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { tag: { select: { id: true, slug: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
