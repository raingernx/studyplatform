import { Prisma, PurchaseStatus, ResourceStatus } from "@prisma/client";
import {
  clearAdminResourceFileById,
  countMarketplaceResources,
  createTagRecord,
  deleteResourceTagJoins,
  deleteTagRecord,
  findAdminResourceEditById,
  findAdminResourceFormTags,
  findAdminResourceTitleById,
  findAdminResourceVersionPageResource,
  findAdminResourceVersionDownload,
  findAdminResourcesPage,
  findAdminTagsWithUsage,
  findCategoriesOrderedByName,
  findTagById,
  findResourceVersionsByResourceId,
  findTagByNameOrSlug,
  findResourceSlugById,
  findTrashedAdminResources,
  updateTagRecord,
} from "@/repositories/resources/resource.repository";
import {
  countAdminAuditLogs,
  findAdminAuditLogs,
  findDistinctAdminAuditActions,
  findRecentAdminActivityLogs,
} from "@/repositories/audit/audit.repository";
import {
  findAdminUserLookup,
  findAdminsWithAuditLogs,
  findAdminUsers,
  findUserSettingsProfile,
} from "@/repositories/users/user.repository";
import { findAdminOrders, findAdminResourcePurchaseSummaries, getAdminOrdersTodayCount, getAdminTotalRevenue } from "@/repositories/purchases/purchase.repository";
import { getUserPurchaseHistory } from "@/services/purchase.service";
import { getUserMembershipOverview } from "@/services/subscriptions/subscription.service";
import { toSlug } from "@/lib/slug";

type AdminResourceRow = {
  id: string;
  title: string;
  slug: string;
  previewUrl: string | null;
  isFree: boolean;
  price: number;
  status: string;
  createdAt: Date;
  author: {
    name: string | null;
    email: string | null;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  downloads: number;
  purchases: number;
  revenue: number;
};

export async function getAdminResourcesPageData(input: {
  q: string;
  statusFilter: string;
  categoryIdFilter: string;
  freeOnly: boolean;
  minRevenueCents: number;
  currentPage: number;
  pageSize: number;
}) {
  const where: Prisma.ResourceWhereInput = { deletedAt: null };

  if (input.q) {
    where.OR = [
      { title: { contains: input.q, mode: "insensitive" } },
      { author: { name: { contains: input.q, mode: "insensitive" } } },
      { author: { email: { contains: input.q, mode: "insensitive" } } },
    ];
  }

  if (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(input.statusFilter)) {
    where.status = input.statusFilter as ResourceStatus;
  }

  if (input.categoryIdFilter) {
    where.categoryId = input.categoryIdFilter;
  }

  const skip = (input.currentPage - 1) * input.pageSize;

  const resourcesPromise = findAdminResourcesPage({
    where,
    skip,
    take: input.pageSize,
  });
  const purchaseSummariesPromise = resourcesPromise.then((resources) =>
    findAdminResourcePurchaseSummaries(resources.map((r) => r.id)),
  );

  const [resources, totalCount, categories, purchaseSummaries] = await Promise.all([
    resourcesPromise,
    countMarketplaceResources(where),
    findCategoriesOrderedByName(),
    purchaseSummariesPromise,
  ]);

  const purchaseSummaryByResourceId = new Map(
    purchaseSummaries.map((row) => [
      row.resourceId,
      {
        purchases: row._count._all,
        revenue: row._sum.amount ?? 0,
      },
    ]),
  );

  let rows: AdminResourceRow[] = resources.map((resource) => {
    const purchaseSummary = purchaseSummaryByResourceId.get(resource.id);

    return {
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      previewUrl: resource.previewUrl ?? null,
      isFree: resource.isFree,
      price: resource.price,
      status: resource.status,
      createdAt: resource.createdAt,
      author: resource.author,
      category: resource.category,
      downloads: resource.downloadCount,
      purchases: purchaseSummary?.purchases ?? 0,
      revenue: purchaseSummary?.revenue ?? 0,
    };
  });

  if (input.freeOnly) {
    rows = rows.filter((row) => row.isFree || row.price === 0);
  }

  if (input.minRevenueCents > 0) {
    rows = rows.filter((row) => row.revenue >= input.minRevenueCents);
  }

  return {
    rows,
    categories: categories.map((category) => ({ id: category.id, name: category.name })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / input.pageSize)),
    hasFilters: Boolean(input.q || input.statusFilter || input.categoryIdFilter),
  };
}

export async function getAdminUsersPageData(input: {
  query: string;
  take?: number;
}) {
  return findAdminUsers({
    query: input.query,
    take: input.take ?? 50,
  });
}

export async function getAdminUserLookupData(input: {
  query: string;
  take?: number;
}) {
  return findAdminUserLookup({
    query: input.query,
    take: input.take ?? 20,
  });
}

export async function getAdminOrdersPageData(input: {
  statusFilter: string;
  from: Date | null;
  to: Date | null;
  take?: number;
}) {
  const where: Prisma.PurchaseWhereInput = {};

  if (input.statusFilter && ["COMPLETED", "REFUNDED", "FAILED"].includes(input.statusFilter)) {
    where.status = input.statusFilter as PurchaseStatus;
  }

  if (input.from || input.to) {
    where.createdAt = {};

    if (input.from && !Number.isNaN(input.from.getTime())) {
      where.createdAt.gte = input.from;
    }

    if (input.to && !Number.isNaN(input.to.getTime())) {
      where.createdAt.lte = input.to;
    }
  }

  const [orders, revenueAgg, ordersTodayAgg] = await Promise.all([
    findAdminOrders({
      where,
      take: input.take ?? 50,
    }),
    getAdminTotalRevenue(),
    getAdminOrdersTodayCount(),
  ]);

  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const ordersToday = ordersTodayAgg._count ?? 0;
  const completedOrders = orders.filter((order) => order.status === "COMPLETED");
  const averageOrderValue =
    completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => sum + order.amount, 0) /
        completedOrders.length
      : 0;

  return {
    orders,
    totalRevenue,
    ordersToday,
    averageOrderValue,
  };
}

export async function getAdminResourceCreatePageData() {
  const [categories, tags] = await Promise.all([
    findCategoriesOrderedByName(),
    findAdminResourceFormTags(),
  ]);

  return { categories, tags };
}

export async function getAdminResourceEditTitle(resourceId: string) {
  return findAdminResourceTitleById(resourceId);
}

export async function getAdminResourceEditPageData(resourceId: string) {
  const [resource, categories, tags] = await Promise.all([
    findAdminResourceEditById(resourceId),
    findCategoriesOrderedByName(),
    findAdminResourceFormTags(),
  ]);

  return { resource, categories, tags };
}

export async function getAdminResourceVersionsPageData(resourceId: string) {
  const [resource, versions] = await Promise.all([
    findAdminResourceVersionPageResource(resourceId),
    findResourceVersionsByResourceId(resourceId),
  ]);

  return { resource, versions };
}

export async function getAdminResourcesTrashPageData(input: { take: number }) {
  const trashedResources = await findTrashedAdminResources({ take: input.take });

  return trashedResources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    deletedAt: resource.deletedAt!,
    author: resource.author,
  }));
}

export async function getAdminTagsPageData() {
  return findAdminTagsWithUsage();
}

export async function getAdminAuditPageData(input: {
  page: number;
  actionFilter: string;
  adminIdFilter: string;
  from: string;
  to: string;
  pageSize: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  const createdAtFilter: Prisma.DateTimeFilter = {};

  if (input.actionFilter) {
    where.action = input.actionFilter;
  }

  if (input.adminIdFilter) {
    where.adminId = input.adminIdFilter;
  }

  if (input.from) {
    createdAtFilter.gte = new Date(input.from);
  }

  if (input.to) {
    const end = new Date(input.to);
    end.setHours(23, 59, 59, 999);
    createdAtFilter.lte = end;
  }

  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  const skip = (input.page - 1) * input.pageSize;

  const [logs, total, actions, admins] = await Promise.all([
    findAdminAuditLogs({
      where,
      skip,
      take: input.pageSize,
    }),
    countAdminAuditLogs(where),
    findDistinctAdminAuditActions(),
    findAdminsWithAuditLogs(),
  ]);

  return {
    items: logs.map((log) => ({
      id: log.id,
      admin: {
        id: log.admin.id,
        name: log.admin.name ?? "Unknown",
        email: log.admin.email ?? "",
      },
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId ?? "",
      createdAt: log.createdAt.toISOString(),
    })),
    actionOptions: actions.map((row) => row.action),
    adminOptions: admins,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export async function getAdminAuditApiData(input: {
  page: number;
  pageSize: number;
  actionFilter?: string;
  adminIdFilter?: string;
  from?: string | null;
  to?: string | null;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  const createdAtFilter: Prisma.DateTimeFilter = {};

  if (input.actionFilter) {
    where.action = input.actionFilter;
  }

  if (input.adminIdFilter) {
    where.adminId = input.adminIdFilter;
  }

  if (input.from) {
    createdAtFilter.gte = new Date(input.from);
  }

  if (input.to) {
    const end = new Date(input.to);
    end.setHours(23, 59, 59, 999);
    createdAtFilter.lte = end;
  }

  if (Object.keys(createdAtFilter).length > 0) {
    where.createdAt = createdAtFilter;
  }

  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await Promise.all([
    findAdminAuditLogs({
      where,
      skip,
      take: input.pageSize,
    }),
    countAdminAuditLogs(where),
  ]);

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export async function getAdminActivityFeedData(limit = 50) {
  return findRecentAdminActivityLogs(limit);
}

export async function createAdminTag(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Tag name is required.", status: 400 as const };
  }

  const slug = toSlug(trimmed);
  if (!slug) {
    return {
      error: "Tag name must contain at least one letter or number.",
      status: 400 as const,
    };
  }

  const existing = await findTagByNameOrSlug(trimmed, slug);
  if (existing) {
    return {
      error: `A tag named "${existing.name}" already exists.`,
      status: 409 as const,
    };
  }

  const tag = await createTagRecord({ name: trimmed, slug });
  return { tag };
}

export async function updateAdminTag(input: { id: string; name: string }) {
  const existingTag = await findTagById(input.id);
  if (!existingTag) {
    return { error: "Tag not found.", status: 404 as const };
  }

  const trimmed = input.name.trim();
  if (!trimmed) {
    return { error: "Tag name is required.", status: 400 as const };
  }

  const slug = toSlug(trimmed);
  if (!slug) {
    return {
      error: "Tag name must contain at least one letter or number.",
      status: 400 as const,
    };
  }

  const existing = await findTagByNameOrSlug(trimmed, slug, input.id);
  if (existing) {
    return {
      error: `A tag named "${existing.name}" already exists.`,
      status: 409 as const,
    };
  }

  const tag = await updateTagRecord({
    id: input.id,
    name: trimmed,
    slug,
  });

  return { tag };
}

export async function deleteAdminTag(tagId: string) {
  const tag = await findTagById(tagId);
  if (!tag) {
    return { error: "Tag not found.", status: 404 as const };
  }

  await deleteResourceTagJoins(tagId);
  await deleteTagRecord(tagId);
  return { tag };
}

export async function getDashboardSettingsPageData(userId: string) {
  const [user, preferences] = await Promise.all([
    findUserSettingsProfile(userId),
    import("@/lib/preferences").then(({ getUserPreferences }) =>
      getUserPreferences(userId),
    ),
  ]);

  return { user, preferences };
}

export async function getDashboardSubscriptionPageData(userId: string) {
  return getUserMembershipOverview(userId);
}

export async function getDashboardPurchaseHistoryPageData(userId: string) {
  return getUserPurchaseHistory(userId);
}

export async function getPublicResourceSlugRedirectTarget(resourceId: string) {
  return findResourceSlugById(resourceId);
}

export async function getAdminResourceVersionsApiData(resourceId: string) {
  const [resource, versions] = await Promise.all([
    findAdminResourceVersionPageResource(resourceId),
    findResourceVersionsByResourceId(resourceId),
  ]);

  if (!resource) {
    return null;
  }

  return versions.map((version) => ({
    id: version.id,
    version: version.version,
    fileName: version.fileName,
    fileSize: version.fileSize,
    mimeType: version.mimeType,
    changelog: version.changelog,
    createdAt: version.createdAt,
    createdBy: version.createdBy
      ? {
          id: version.createdBy.id,
          name: version.createdBy.name,
          email: version.createdBy.email,
        }
      : null,
  }));
}

export async function clearAdminResourceFile(resourceId: string) {
  return clearAdminResourceFileById(resourceId);
}

export async function getAdminResourceVersionDownloadData(
  resourceId: string,
  versionId: string,
) {
  return findAdminResourceVersionDownload(resourceId, versionId);
}
