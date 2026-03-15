import { Prisma, type AnalyticsEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  last24hPurchases: number;
  last7dPurchases: number;
  last30dPurchases: number;
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

interface ResourceIdRow {
  resourceId: string;
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

export async function fetchResourceEventAggregates(
  last24h: Date,
  last7d: Date,
  last30d: Date,
): Promise<ResourceEventAggregateRow[]> {
  return prisma.$queryRaw<ResourceEventAggregateRow[]>`
    SELECT
      r.id AS "resourceId",
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
  const rows = await prisma.resourceStat.findMany({
    select: { resourceId: true },
    orderBy: [{ trendingScore: "desc" }, { downloads: "desc" }],
    take: limit,
  });

  return rows.map((row) => row.resourceId);
}

export async function findTopDownloadedResourceIds(limit: number) {
  const rows = await prisma.resourceStat.findMany({
    select: { resourceId: true },
    orderBy: [{ downloads: "desc" }, { purchases: "desc" }],
    take: limit,
  });

  return rows.map((row) => row.resourceId);
}

export async function findNewestResourceIds(limit: number) {
  const rows = await prisma.$queryRaw<ResourceIdRow[]>`
    SELECT rs."resourceId"
    FROM "resource_stats" rs
    INNER JOIN "Resource" r
      ON r.id = rs."resourceId"
    WHERE r."deletedAt" IS NULL
      AND r.status = 'PUBLISHED'
    ORDER BY r."createdAt" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => row.resourceId);
}

export async function findFeaturedResourceIds(limit: number) {
  const rows = await prisma.$queryRaw<ResourceIdRow[]>`
    SELECT rs."resourceId"
    FROM "resource_stats" rs
    INNER JOIN "Resource" r
      ON r.id = rs."resourceId"
    WHERE r."deletedAt" IS NULL
      AND r.status = 'PUBLISHED'
      AND r.featured = true
    ORDER BY rs."trendingScore" DESC, rs.downloads DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => row.resourceId);
}

export async function findFreeResourceIds(limit: number) {
  const rows = await prisma.$queryRaw<ResourceIdRow[]>`
    SELECT rs."resourceId"
    FROM "resource_stats" rs
    INNER JOIN "Resource" r
      ON r.id = rs."resourceId"
    WHERE r."deletedAt" IS NULL
      AND r.status = 'PUBLISHED'
      AND r."isFree" = true
    ORDER BY rs.downloads DESC, rs."trendingScore" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => row.resourceId);
}

export async function findResourceStatByResourceId(resourceId: string) {
  return prisma.resourceStat.findUnique({
    where: { resourceId },
  });
}

export async function findCreatorStatByCreatorId(creatorId: string) {
  return prisma.creatorStat.findUnique({
    where: { creatorId },
  });
}

export async function findTopResourcesByDownloads(limit: number) {
  return prisma.resourceStat.findMany({
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
