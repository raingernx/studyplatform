import { Prisma, type CreatorStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreatorResourceFilters {
  status?: "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pricing?: "all" | "free" | "paid";
  categoryId?: string;
}

export interface CreatorSeriesRow {
  date: Date;
  count: number;
  amount: number;
}

export interface CreatorEarningsTotals {
  grossRevenue: number;
  creatorShare: number;
  platformFees: number;
}

export interface CreatorDashboardStatsRecord {
  totalRevenue: number;
  totalSales: number;
  totalResources: number;
}

export interface CreatorResourcePerformanceRecord {
  resourceId: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  price: number;
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
  downloadCount: number;
  salesCount: number;
  revenue: number;
  averageRating: number | null;
  visibleReviewCount: number;
}

export interface CreatorResourceStatusSummaryRecord {
  draft: number;
  published: number;
  archived: number;
}

export interface CreatorReviewOverviewRecord {
  averageRating: number | null;
  totalVisibleReviews: number;
  resourcesWithVisibleReviews: number;
}

export interface CreatorResourceReviewSummaryRecord {
  resourceId: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  price: number;
  isFree: boolean;
  updatedAt: Date;
  averageRating: number | null;
  visibleReviewCount: number;
  lastReviewDate: Date | null;
}

export interface CreatorRecentVisibleReviewRecord {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
  resource: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface CreatorRatingDistributionRecord {
  rating: number;
  count: number;
}

function shouldRetryCreatorStatusActivation(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code !== "P2022" && error.code !== "P2021") {
      return false;
    }

    const message = `${error.message} ${JSON.stringify(error.meta ?? {})}`.toLowerCase();
    return message.includes("creatorstatus");
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return /creatorstatus|\"creatorStatus\"|creatorstatus|enum/i.test(error.message);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return /creatorstatus|\"creatorStatus\"|creatorstatus|enum/i.test(error.message);
  }

  if (error instanceof Error) {
    return /creatorstatus|\"creatorStatus\"|creatorstatus|type mismatch|enum/i.test(
      error.message,
    );
  }

  return false;
}

export async function findCreatorAccessContext(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      creatorEnabled: true,
      creatorStatus: true,
      _count: {
        select: {
          resources: {
            where: {
              status: "PUBLISHED",
              deletedAt: null,
            },
          },
        },
      },
    },
  });
}

export async function findCreatorProfileByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      creatorEnabled: true,
      name: true,
      email: true,
      image: true,
      creatorDisplayName: true,
      creatorSlug: true,
      creatorBio: true,
      creatorBanner: true,
      creatorStatus: true,
      creatorSocialLinks: true,
      createdAt: true,
    },
  });
}

export async function findCreatorProfileBySlug(slug: string) {
  return prisma.user.findFirst({
    where: {
      creatorSlug: slug,
      creatorEnabled: true,
      creatorStatus: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      creatorEnabled: true,
      image: true,
      creatorDisplayName: true,
      creatorSlug: true,
      creatorBio: true,
      creatorBanner: true,
      creatorStatus: true,
      creatorSocialLinks: true,
      resources: {
        where: {
          status: "PUBLISHED",
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          isFree: true,
          price: true,
          downloadCount: true,
          previewUrl: true,
          previews: {
            take: 1,
            orderBy: { order: "asc" as const },
            select: { imageUrl: true },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              purchases: true,
              reviews: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 12,
      },
      _count: {
        select: {
          resources: {
            where: {
              status: "PUBLISHED",
              deletedAt: null,
            },
          },
        },
      },
    },
  });
}

export async function findCreatorPublicProfileById(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      creatorEnabled: true,
      creatorStatus: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      creatorEnabled: true,
      image: true,
      creatorDisplayName: true,
      creatorSlug: true,
      creatorBio: true,
      creatorBanner: true,
      creatorStatus: true,
      creatorSocialLinks: true,
      resources: {
        where: {
          status: "PUBLISHED",
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          isFree: true,
          price: true,
          downloadCount: true,
          previewUrl: true,
          previews: {
            take: 1,
            orderBy: { order: "asc" as const },
            select: { imageUrl: true },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              purchases: true,
              reviews: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 12,
      },
      _count: {
        select: {
          resources: true,
        },
      },
    },
  });
}

export async function findCreatorSlugOwner(slug: string) {
  return prisma.user.findUnique({
    where: { creatorSlug: slug },
    select: {
      id: true,
    },
  });
}

export async function enableCreatorAccessRecord(userId: string) {
  const select = {
    id: true,
    creatorEnabled: true,
    creatorStatus: true,
    role: true,
  } satisfies Prisma.UserSelect;

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        creatorEnabled: true,
        creatorStatus: "ACTIVE",
      },
      select,
    });
  } catch (error) {
    if (!shouldRetryCreatorStatusActivation(error)) {
      throw error;
    }

    // Backward-compatible fallback for environments where the DB schema lags
    // behind the generated Prisma client and creatorStatus cannot be written yet.
    return prisma.user.update({
      where: { id: userId },
      data: {
        creatorEnabled: true,
      },
      select,
    });
  }
}

export async function findCreatorCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

function buildCreatorResourceWhere(
  userId: string,
  filters?: CreatorResourceFilters,
): Prisma.ResourceWhereInput {
  const where: Prisma.ResourceWhereInput = {
    authorId: userId,
    deletedAt: null,
  };

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.pricing === "free") {
    where.isFree = true;
  }

  if (filters?.pricing === "paid") {
    where.isFree = false;
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  return where;
}

export async function findCreatorResourcesByUserId(
  userId: string,
  filters?: CreatorResourceFilters,
) {
  return prisma.resource.findMany({
    where: buildCreatorResourceWhere(userId, filters),
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      isFree: true,
      price: true,
      fileUrl: true,
      previewUrl: true,
      downloadCount: true,
      createdAt: true,
      updatedAt: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      previews: {
        orderBy: { order: "asc" as const },
        select: {
          id: true,
          imageUrl: true,
          order: true,
        },
      },
      resourceStat: {
        select: {
          downloads: true,
          purchases: true,
          revenue: true,
        },
      },
      _count: {
        select: {
          purchases: true,
          reviews: true,
        },
      },
    },
  });
}

export async function getCreatorStats(authorId: string): Promise<CreatorDashboardStatsRecord> {
  const [salesAggregate, totalResources] = await Promise.all([
    prisma.purchase.aggregate({
      where: {
        authorId,
        status: "COMPLETED",
      },
      _sum: {
        authorRevenue: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.resource.count({
      where: {
        authorId,
        deletedAt: null,
      },
    }),
  ]);

  return {
    totalRevenue: salesAggregate._sum.authorRevenue ?? 0,
    totalSales: salesAggregate._count.id ?? 0,
    totalResources,
  };
}

export async function getCreatorResourcePerformance(
  authorId: string,
): Promise<CreatorResourcePerformanceRecord[]> {
  const [resources, salesByResource, reviewGroups] = await Promise.all([
    prisma.resource.findMany({
      where: {
        authorId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        isFree: true,
        createdAt: true,
        updatedAt: true,
        downloadCount: true,
        resourceStat: {
          select: {
            downloads: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.purchase.groupBy({
      by: ["resourceId"],
      where: {
        authorId,
        status: "COMPLETED",
      },
      _count: {
        id: true,
      },
      _sum: {
        authorRevenue: true,
      },
    }),
    prisma.review.groupBy({
      by: ["resourceId"],
      where: {
        isVisible: true,
        resource: {
          authorId,
          deletedAt: null,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const salesLookup = new Map(
    salesByResource.map((row) => [
      row.resourceId,
      {
        salesCount: row._count.id ?? 0,
        revenue: row._sum.authorRevenue ?? 0,
      },
    ]),
  );

  const reviewLookup = new Map(
    reviewGroups.map((row) => [
      row.resourceId,
      {
        averageRating: row._avg.rating ?? null,
        visibleReviewCount: row._count.id ?? 0,
      },
    ]),
  );

  return resources
    .map((resource) => {
      const performance = salesLookup.get(resource.id);
      const reviewSummary = reviewLookup.get(resource.id);

      return {
        resourceId: resource.id,
        title: resource.title,
        slug: resource.slug,
        status: resource.status,
        price: resource.price,
        isFree: resource.isFree,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
        downloadCount: resource.resourceStat?.downloads ?? resource.downloadCount,
        salesCount: performance?.salesCount ?? 0,
        revenue: performance?.revenue ?? 0,
        averageRating: reviewSummary?.averageRating ?? null,
        visibleReviewCount: reviewSummary?.visibleReviewCount ?? 0,
      };
    })
    .sort(
      (a, b) =>
        b.revenue - a.revenue ||
        b.salesCount - a.salesCount ||
        b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
}

export async function findCreatorResourceStatusSummary(
  authorId: string,
): Promise<CreatorResourceStatusSummaryRecord> {
  const rows = await prisma.resource.groupBy({
    by: ["status"],
    where: {
      authorId,
      deletedAt: null,
    },
    _count: {
      _all: true,
    },
  });

  return rows.reduce<CreatorResourceStatusSummaryRecord>(
    (summary, row) => {
      if (row.status === "PUBLISHED") {
        summary.published = row._count._all;
      } else if (row.status === "ARCHIVED") {
        summary.archived = row._count._all;
      } else {
        summary.draft = row._count._all;
      }

      return summary;
    },
    { draft: 0, published: 0, archived: 0 },
  );
}

export async function getCreatorReviewOverview(
  authorId: string,
): Promise<CreatorReviewOverviewRecord> {
  const [reviewAggregate, resourcesWithVisibleReviews] = await Promise.all([
    prisma.review.aggregate({
      where: {
        isVisible: true,
        resource: {
          authorId,
          deletedAt: null,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.resource.count({
      where: {
        authorId,
        deletedAt: null,
        reviews: {
          some: {
            isVisible: true,
          },
        },
      },
    }),
  ]);

  return {
    averageRating: reviewAggregate._avg.rating ?? null,
    totalVisibleReviews: reviewAggregate._count.id ?? 0,
    resourcesWithVisibleReviews,
  };
}

export async function getCreatorResourceReviewSummaries(
  authorId: string,
): Promise<CreatorResourceReviewSummaryRecord[]> {
  const [resources, reviewGroups] = await Promise.all([
    prisma.resource.findMany({
      where: {
        authorId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        isFree: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.review.groupBy({
      by: ["resourceId"],
      where: {
        isVisible: true,
        resource: {
          authorId,
          deletedAt: null,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    }),
  ]);

  const reviewLookup = new Map(
    reviewGroups.map((row) => [
      row.resourceId,
      {
        averageRating: row._avg.rating ?? null,
        visibleReviewCount: row._count.id ?? 0,
        lastReviewDate: row._max.createdAt ?? null,
      },
    ]),
  );

  return resources.map((resource) => {
    const summary = reviewLookup.get(resource.id);

    return {
      resourceId: resource.id,
      title: resource.title,
      slug: resource.slug,
      status: resource.status,
      price: resource.price,
      isFree: resource.isFree,
      updatedAt: resource.updatedAt,
      averageRating: summary?.averageRating ?? null,
      visibleReviewCount: summary?.visibleReviewCount ?? 0,
      lastReviewDate: summary?.lastReviewDate ?? null,
    };
  });
}

export async function findCreatorRecentVisibleReviews(
  authorId: string,
  limit: number,
): Promise<CreatorRecentVisibleReviewRecord[]> {
  return prisma.review.findMany({
    where: {
      isVisible: true,
      resource: {
        authorId,
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function getCreatorVisibleRatingDistribution(
  authorId: string,
): Promise<CreatorRatingDistributionRecord[]> {
  const rows = await prisma.review.groupBy({
    by: ["rating"],
    where: {
      isVisible: true,
      resource: {
        authorId,
        deletedAt: null,
      },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      rating: "desc",
    },
  });

  return rows.map((row) => ({
    rating: row.rating,
    count: row._count._all,
  }));
}

export async function findCreatorResourceById(userId: string, resourceId: string) {
  return prisma.resource.findFirst({
    where: {
      id: resourceId,
      authorId: userId,
      deletedAt: null,
    },
    select: {
      id: true,
      authorId: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      status: true,
      isFree: true,
      price: true,
      fileUrl: true,
      categoryId: true,
      previewUrl: true,
      createdAt: true,
      updatedAt: true,
      previews: {
        orderBy: { order: "asc" as const },
        select: {
          imageUrl: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      resourceStat: {
        select: {
          downloads: true,
          purchases: true,
          revenue: true,
        },
      },
    },
  });
}

export async function findCreatorResourceBySlug(userId: string, slug: string) {
  return prisma.resource.findFirst({
    where: {
      authorId: userId,
      slug,
    },
    select: {
      id: true,
    },
  });
}

export interface CreateCreatorResourceRecordInput {
  userId: string;
  title: string;
  slug: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  categoryId: string | null;
  fileUrl: string | null;
  previewUrl: string | null;
  previewUrls: string[];
}

export interface UpdateCreatorResourceRecordInput {
  title?: string;
  slug?: string;
  description?: string;
  type?: "PDF" | "DOCUMENT";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree?: boolean;
  price?: number;
  categoryId?: string | null;
  fileUrl?: string | null;
  previewUrl?: string | null;
  previewUrls?: string[];
}

export async function createCreatorResourceRecord(input: CreateCreatorResourceRecordInput) {
  return prisma.resource.create({
    data: {
      authorId: input.userId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      status: input.status,
      isFree: input.isFree,
      price: input.price,
      categoryId: input.categoryId,
      fileUrl: input.fileUrl,
      previewUrl: input.previewUrl,
      previews:
        input.previewUrls.length > 0
          ? {
              create: input.previewUrls.map((imageUrl, order) => ({
                imageUrl,
                order,
              })),
            }
          : undefined,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    },
  });
}

export async function updateCreatorResourceRecord(
  userId: string,
  resourceId: string,
  input: UpdateCreatorResourceRecordInput,
) {
  return prisma.$transaction(async (tx) => {
    const resource = await tx.resource.findFirst({
      where: {
        id: resourceId,
        authorId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!resource) {
      return null;
    }

    const updated = await tx.resource.update({
      where: { id: resourceId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.isFree !== undefined ? { isFree: input.isFree } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
        ...(input.previewUrl !== undefined ? { previewUrl: input.previewUrl } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
      },
    });

    if (input.previewUrls !== undefined) {
      await tx.resourcePreview.deleteMany({
        where: { resourceId },
      });

      if (input.previewUrls.length > 0) {
        await tx.resourcePreview.createMany({
          data: input.previewUrls.map((imageUrl, order) => ({
            resourceId,
            imageUrl,
            order,
          })),
        });
      }
    }

    return updated;
  });
}

export async function updateCreatorResourceStatusRecord(
  userId: string,
  resourceId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  return prisma.resource.updateMany({
    where: {
      id: resourceId,
      authorId: userId,
      deletedAt: null,
    },
    data: { status },
  });
}

export async function findCreatorRecentSales(userId: string, limit: number) {
  return prisma.creatorRevenue.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      creatorShare: true,
      createdAt: true,
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      purchase: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function findCreatorSales(userId: string) {
  return prisma.creatorRevenue.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      creatorShare: true,
      platformFee: true,
      createdAt: true,
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      purchase: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function findCreatorEarningsTotals(userId: string): Promise<CreatorEarningsTotals> {
  const totals = await prisma.creatorRevenue.aggregate({
    where: { creatorId: userId },
    _sum: {
      amount: true,
      creatorShare: true,
      platformFee: true,
    },
  });

  return {
    grossRevenue: totals._sum.amount ?? 0,
    creatorShare: totals._sum.creatorShare ?? 0,
    platformFees: totals._sum.platformFee ?? 0,
  };
}

export async function findCreatorRecentDownloads(userId: string, limit: number) {
  return prisma.downloadEvent.findMany({
    where: {
      resource: {
        authorId: userId,
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      createdAt: true,
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function findCreatorRevenueSeries(userId: string, since?: Date) {
  const sinceClause = since
    ? Prisma.sql`AND cr."createdAt" >= ${since}`
    : Prisma.empty;

  return prisma.$queryRaw<CreatorSeriesRow[]>`
    SELECT
      DATE_TRUNC('day', cr."createdAt")::date AS date,
      COUNT(cr.id)::int AS count,
      COALESCE(SUM(cr.amount), 0)::int AS amount
    FROM "creator_revenue" cr
    WHERE cr."creatorId" = ${userId}
      ${sinceClause}
    GROUP BY DATE_TRUNC('day', cr."createdAt")::date
    ORDER BY DATE_TRUNC('day', cr."createdAt")::date ASC
  `;
}

export async function findCreatorDownloadSeries(userId: string, since?: Date) {
  const sinceClause = since
    ? Prisma.sql`AND de."createdAt" >= ${since}`
    : Prisma.empty;

  return prisma.$queryRaw<CreatorSeriesRow[]>`
    SELECT
      DATE_TRUNC('day', de."createdAt")::date AS date,
      COUNT(de.id)::int AS count,
      0::int AS amount
    FROM "DownloadEvent" de
    INNER JOIN "Resource" r
      ON r.id = de."resourceId"
    WHERE r."authorId" = ${userId}
      ${sinceClause}
    GROUP BY DATE_TRUNC('day', de."createdAt")::date
    ORDER BY DATE_TRUNC('day', de."createdAt")::date ASC
  `;
}

export async function updateCreatorProfileRecord(
  userId: string,
  data: {
    creatorDisplayName?: string | null;
    creatorSlug?: string | null;
    creatorBio?: string | null;
    creatorBanner?: string | null;
    creatorStatus?: CreatorStatus;
    creatorSocialLinks?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      creatorDisplayName: true,
      creatorSlug: true,
      creatorBio: true,
      creatorBanner: true,
      creatorStatus: true,
      creatorSocialLinks: true,
    },
  });
}
