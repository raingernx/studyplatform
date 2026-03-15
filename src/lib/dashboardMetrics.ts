import { prisma } from "@/lib/prisma";
import { getTopViewedResources } from "@/lib/analytics";
import { subDays } from "date-fns";

export interface DashboardMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  totalPurchases: number;
  topResources: Awaited<ReturnType<typeof getTopViewedResources>>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const yesterday = subDays(now, 1);
  const lastWeek = subDays(now, 7);

  const [dailyActiveUsers, weeklyActiveUsers, totalPurchases, topResources] =
    await Promise.all([
      prisma.activityLog
        .groupBy({
          by: ["userId"],
          where: {
            userId: { not: null },
            createdAt: { gte: yesterday },
          },
        })
        .then((rows) => rows.length),
      prisma.activityLog
        .groupBy({
          by: ["userId"],
          where: {
            userId: { not: null },
            createdAt: { gte: lastWeek },
          },
        })
        .then((rows) => rows.length),
      prisma.purchase.count({
        where: {
          status: "COMPLETED",
        },
      }),
      getTopViewedResources(),
    ]);

  return {
    dailyActiveUsers,
    weeklyActiveUsers,
    totalPurchases,
    topResources,
  };
}

