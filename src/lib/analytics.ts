import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function getActiveUsersLast7Days(): Promise<number> {
  const since = subDays(new Date(), 7);

  const rows = await prisma.activityLog.groupBy({
    by: ["userId"],
    where: {
      userId: { not: null },
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });

  return rows.length;
}

export async function getTopViewedResources(limit = 10) {
  const rows = await prisma.activityLog.groupBy({
    by: ["entityId"],
    where: {
      action: "RESOURCE_VIEW",
      entity: "Resource",
      entityId: { not: null },
    },
    _count: { _all: true },
    orderBy: {
      _count: { _all: "desc" },
    },
    take: limit,
  });

  const resourceIds = rows.map((r) => r.entityId as string);

  if (resourceIds.length === 0) {
    return [];
  }

  const resources = await prisma.resource.findMany({
    where: { id: { in: resourceIds } },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  const resourceById = new Map(resources.map((r) => [r.id, r]));

  return rows
    .map((row) => {
      const res = resourceById.get(row.entityId as string);
      if (!res) return null;
      return {
        resourceId: res.id,
        title: res.title,
        slug: res.slug,
        viewCount: row._count._all,
      };
    })
    .filter(Boolean) as {
    resourceId: string;
    title: string;
    slug: string;
    viewCount: number;
  }[];
}

export async function getConversionFunnel() {
  const since = subDays(new Date(), 30);

  const [views, downloads, purchases] = await Promise.all([
    prisma.activityLog.count({
      where: {
        action: "RESOURCE_VIEW",
        createdAt: { gte: since },
      },
    }),
    prisma.activityLog.count({
      where: {
        action: "RESOURCE_DOWNLOAD",
        createdAt: { gte: since },
      },
    }),
    prisma.activityLog.count({
      where: {
        action: "PURCHASE_COMPLETED",
        createdAt: { gte: since },
      },
    }),
  ]);

  return {
    views,
    downloads,
    purchases,
  };
}

