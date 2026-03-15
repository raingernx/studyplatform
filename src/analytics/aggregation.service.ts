import {
  fetchCreatorDownloadAggregates,
  fetchCreatorResourceCounts,
  fetchCreatorRevenueAggregates,
  fetchPlatformDownloadRows,
  fetchPlatformNewResourceRows,
  fetchPlatformNewUserRows,
  fetchPlatformRevenueRows,
  fetchResourceEventAggregates,
  fetchResourceRevenueAggregates,
  replaceCreatorStats,
  replaceResourceStats,
  upsertPlatformStats,
} from "@/repositories/analytics/analytics.repository";

const DAY_MS = 86_400_000;

export interface TrendingScoreInput {
  last24hDownloads: number;
  last24hPurchases: number;
  last7dDownloads: number;
  last7dPurchases: number;
}

export function calculateTrendingScore(input: TrendingScoreInput) {
  return (
    input.last24hDownloads * 5 +
    input.last24hPurchases * 10 +
    input.last7dDownloads * 2 +
    input.last7dPurchases * 4
  );
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function aggregateResourceStats(now = new Date()) {
  const last24h = new Date(now.getTime() - DAY_MS);
  const last7d = new Date(now.getTime() - DAY_MS * 7);
  const last30d = new Date(now.getTime() - DAY_MS * 30);

  const [eventRows, revenueRows] = await Promise.all([
    fetchResourceEventAggregates(last24h, last7d, last30d),
    fetchResourceRevenueAggregates(last24h, last7d, last30d),
  ]);

  const revenueByResourceId = new Map(
    revenueRows.map((row) => [row.resourceId, row]),
  );

  const rows = eventRows.map((eventRow) => {
    const revenueRow = revenueByResourceId.get(eventRow.resourceId);
    const last24hPurchases = revenueRow?.last24hPurchases ?? 0;
    const last7dPurchases = revenueRow?.last7dPurchases ?? 0;

    return {
      resourceId: eventRow.resourceId,
      views: eventRow.views,
      downloads: eventRow.downloads,
      purchases: revenueRow?.purchases ?? 0,
      revenue: revenueRow?.revenue ?? 0,
      last24hDownloads: eventRow.last24hDownloads,
      last7dDownloads: eventRow.last7dDownloads,
      last30dDownloads: eventRow.last30dDownloads,
      last24hPurchases,
      last7dPurchases,
      last30dPurchases: revenueRow?.last30dPurchases ?? 0,
      trendingScore: calculateTrendingScore({
        last24hDownloads: eventRow.last24hDownloads,
        last24hPurchases,
        last7dDownloads: eventRow.last7dDownloads,
        last7dPurchases,
      }),
    };
  });

  await replaceResourceStats(rows);
  return rows.length;
}

export async function aggregateCreatorStats(now = new Date()) {
  const last7d = new Date(now.getTime() - DAY_MS * 7);
  const last30d = new Date(now.getTime() - DAY_MS * 30);

  const [resourceCounts, downloadRows, revenueRows] = await Promise.all([
    fetchCreatorResourceCounts(),
    fetchCreatorDownloadAggregates(),
    fetchCreatorRevenueAggregates(last7d, last30d),
  ]);

  const creatorIds = new Set<string>();
  for (const row of resourceCounts) creatorIds.add(row.creatorId);
  for (const row of downloadRows) creatorIds.add(row.creatorId);
  for (const row of revenueRows) creatorIds.add(row.creatorId);

  const resourceCountMap = new Map(
    resourceCounts.map((row) => [row.creatorId, row.resources]),
  );
  const downloadMap = new Map(
    downloadRows.map((row) => [
      row.creatorId,
      {
        totalDownloads: row.totalDownloads,
        last30dDownloads: row.last30dDownloads,
      },
    ]),
  );
  const revenueMap = new Map(revenueRows.map((row) => [row.creatorId, row]));

  const rows = Array.from(creatorIds).map((creatorId) => {
    const revenueRow = revenueMap.get(creatorId);

    return {
      creatorId,
      resources: resourceCountMap.get(creatorId) ?? 0,
      totalDownloads: downloadMap.get(creatorId)?.totalDownloads ?? 0,
      last30dDownloads: downloadMap.get(creatorId)?.last30dDownloads ?? 0,
      totalSales: revenueRow?.totalSales ?? 0,
      totalRevenue: revenueRow?.totalRevenue ?? 0,
      last7dRevenue: revenueRow?.last7dRevenue ?? 0,
      last30dRevenue: revenueRow?.last30dRevenue ?? 0,
    };
  });

  await replaceCreatorStats(rows);
  return rows.length;
}

export async function aggregatePlatformStats() {
  const [downloadRows, revenueRows, userRows, resourceRows] = await Promise.all([
    fetchPlatformDownloadRows(),
    fetchPlatformRevenueRows(),
    fetchPlatformNewUserRows(),
    fetchPlatformNewResourceRows(),
  ]);

  const dayMap = new Map<
    string,
    {
      date: Date;
      totalDownloads: number;
      totalSales: number;
      totalRevenue: number;
      newUsers: number;
      newResources: number;
    }
  >();

  const ensureDay = (date: Date) => {
    const normalizedDate = startOfUtcDay(date);
    const key = normalizedDate.toISOString().slice(0, 10);

    if (!dayMap.has(key)) {
      dayMap.set(key, {
        date: normalizedDate,
        totalDownloads: 0,
        totalSales: 0,
        totalRevenue: 0,
        newUsers: 0,
        newResources: 0,
      });
    }

    return dayMap.get(key)!;
  };

  for (const row of downloadRows) {
    ensureDay(row.date).totalDownloads = row.total;
  }

  for (const row of revenueRows) {
    const entry = ensureDay(row.date);
    entry.totalSales = row.totalSales;
    entry.totalRevenue = row.totalRevenue;
  }

  for (const row of userRows) {
    ensureDay(row.date).newUsers = row.total;
  }

  for (const row of resourceRows) {
    ensureDay(row.date).newResources = row.total;
  }

  const rows = Array.from(dayMap.values()).sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );

  await upsertPlatformStats(rows);
  return rows.length;
}

export async function runAnalyticsAggregation(now = new Date()) {
  const [resourceStats, creatorStats, platformStats] = await Promise.all([
    aggregateResourceStats(now),
    aggregateCreatorStats(now),
    aggregatePlatformStats(),
  ]);

  return {
    resourceStats,
    creatorStats,
    platformStats,
  };
}

export async function refreshTrendingScores(now = new Date()) {
  return aggregateResourceStats(now);
}
