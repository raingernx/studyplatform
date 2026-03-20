import { prisma } from "@/lib/prisma";
import { LISTED_RESOURCE_WHERE } from "@/lib/query/resourceFilters";

export interface FindPublicResourcesParams {
  page: number;
  pageSize: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  isFree?: boolean;
}

export interface CreateAdminResourceRecordInput {
  title: string;
  slug: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  categoryId: string | null;
  featured: boolean;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  license?: "PERSONAL_USE" | "COMMERCIAL_USE" | "EXTENDED_LICENSE" | null;
  visibility?: "PUBLIC" | "UNLISTED" | null;
  authorId: string;
  tagIds: string[];
  previewUrls: string[];
  previewUrl: string | null;
}

export interface BulkAdminResourceRecordInput extends CreateAdminResourceRecordInput {
  row: number;
}

export interface UpdateAdminResourceRecordInput {
  title?: string;
  description?: string;
  slug?: string;
  type?: "PDF" | "DOCUMENT";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl?: string | null;
  categoryId?: string | null;
  featured?: boolean;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  license?: "PERSONAL_USE" | "COMMERCIAL_USE" | "EXTENDED_LICENSE" | null;
  visibility?: "PUBLIC" | "UNLISTED" | null;
  authorId?: string;
  previewUrl?: string | null;
  tagIds?: string[];
  previewUrls?: string[];
}

const RESOURCE_LIST_INCLUDE = {
  id: true,
  title: true,
  slug: true,
  price: true,
  isFree: true,
  featured: true,
  createdAt: true,
  downloadCount: true,
  previewUrl: true,
  author: { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true } },
  previews: { orderBy: { order: "asc" as const }, select: { imageUrl: true } },
} as const;

const ADMIN_RESOURCE_LIST_INCLUDE = {
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  _count: { select: { purchases: true } },
} as const;

const OWNED_RESOURCE_CREATE_INCLUDE = {
  author: { select: { id: true, name: true } },
  category: true,
  tags: { include: { tag: true } },
} as const;

const CREATOR_DASHBOARD_RESOURCE_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  isFree: true,
  price: true,
  previewUrl: true,
  createdAt: true,
  updatedAt: true,
  previews: {
    take: 1,
    orderBy: { order: "asc" as const },
    select: { imageUrl: true },
  },
} as const;

export async function findPublicResources(params: FindPublicResourcesParams) {
  const { page, pageSize, categorySlug, tagSlug, search, isFree } = params;

  const categoryId = categorySlug
    ? (await findCategoryBySlug(categorySlug))?.id
    : undefined;

  if (categorySlug && !categoryId) {
    return { items: [], total: 0 };
  }

  const where = {
    ...LISTED_RESOURCE_WHERE,
    ...(categoryId && { categoryId }),
    ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
    ...(isFree !== undefined && { isFree }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      select: RESOURCE_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  return { items, total };
}

export async function findAdminActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}

export async function findAdminResources(authorId?: string) {
  return prisma.resource.findMany({
    where: {
      deletedAt: null,
      ...(authorId ? { authorId } : {}),
    },
    include: ADMIN_RESOURCE_LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function findCreatorOwnedResources(authorId: string) {
  return prisma.resource.findMany({
    where: {
      authorId,
      deletedAt: null,
    },
    select: CREATOR_DASHBOARD_RESOURCE_SELECT,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function findRecommendedResourcesExcludingIds(
  resourceIds: string[],
  take: number,
) {
  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_LIST_INCLUDE,
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
      { resourceStat: { downloads: "desc" } },
      { createdAt: "desc" },
    ],
    take,
  });
}

export async function findNewResourcesInCategoryExcludingIds(
  categoryId: string,
  resourceIds: string[],
  take: number,
) {
  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId,
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_LIST_INCLUDE,
    orderBy: [
      { createdAt: "desc" },
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
    ],
    take,
  });
}

export async function findNewResourcesInCategoriesExcludingIds(
  categoryIds: string[],
  resourceIds: string[],
  take: number,
) {
  if (categoryIds.length === 0) {
    return [];
  }

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId: { in: categoryIds },
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_LIST_INCLUDE,
    orderBy: [
      { createdAt: "desc" },
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
    ],
    take,
  });
}

export async function findRecommendedResourcesByLevelsExcludingIds(
  levels: Array<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">,
  resourceIds: string[],
  take: number,
) {
  if (levels.length === 0) {
    return [];
  }

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      level: { in: levels },
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_LIST_INCLUDE,
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
      { resourceStat: { downloads: "desc" } },
      { createdAt: "desc" },
    ],
    take,
  });
}

export async function findResourceById(id: string) {
  return prisma.resource.findUnique({
    where: { id },
  });
}

export async function findDownloadableResourceById(id: string) {
  return prisma.resource.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      isFree: true,
      fileKey: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
    },
  });
}

export async function findResourceBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
  });
}

export async function setResourceStripePriceId(resourceId: string, stripePriceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: { stripePriceId },
  });
}

export async function findCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export async function findTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export async function createAdminResourceRecord(input: CreateAdminResourceRecordInput) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      status: input.status,
      isFree: input.isFree,
      price: input.price,
      fileUrl: input.fileUrl,
      stripePriceId: input.stripePriceId ?? null,
      stripeProductId: input.stripeProductId ?? null,
      categoryId: input.categoryId,
      featured: input.featured,
      level: input.level ?? null,
      license: input.license ?? null,
      visibility: input.visibility ?? null,
      previewUrl: input.previewUrl,
      authorId: input.authorId,
      tags: {
        create: input.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      },
      previews: {
        create: input.previewUrls.map((imageUrl, order) => ({
          imageUrl,
          order,
        })),
      },
    },
  });
}

export async function createOwnedResourceRecord(input: CreateAdminResourceRecordInput) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      status: input.status,
      isFree: input.isFree,
      price: input.price,
      fileUrl: input.fileUrl,
      stripePriceId: input.stripePriceId ?? null,
      stripeProductId: input.stripeProductId ?? null,
      categoryId: input.categoryId,
      featured: input.featured,
      level: input.level ?? null,
      license: input.license ?? null,
      visibility: input.visibility ?? null,
      previewUrl: input.previewUrl,
      authorId: input.authorId,
      tags: input.tagIds.length
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
      previews: input.previewUrls.length
        ? {
            create: input.previewUrls.map((imageUrl, order) => ({
              imageUrl,
              order,
            })),
          }
        : undefined,
    },
    include: OWNED_RESOURCE_CREATE_INCLUDE,
  });
}

export async function deleteStaleDraftResources(cutoff: Date) {
  return prisma.resource.deleteMany({
    where: {
      title: "",
      description: "",
      fileUrl: null,
      fileKey: null,
      status: "DRAFT",
      createdAt: {
        lt: cutoff,
      },
    },
  });
}

export async function createDraftResourceRecord(input: {
  title: string;
  slug: string;
  authorId: string;
}) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: "",
      type: "PDF",
      status: "DRAFT",
      isFree: true,
      price: 0,
      fileUrl: null,
      categoryId: null,
      featured: false,
      authorId: input.authorId,
    },
    select: {
      id: true,
    },
  });
}

export async function createAdminResourcesBulk(items: BulkAdminResourceRecordInput[]) {
  const created: { row: number; title: string; id: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const resource = await tx.resource.create({
        data: {
          title: item.title,
          slug: item.slug,
          description: item.description,
          type: item.type,
          status: item.status,
          isFree: item.isFree,
          price: item.price,
          fileUrl: item.fileUrl,
          categoryId: item.categoryId,
          featured: item.featured,
          previewUrl: item.previewUrl,
          authorId: item.authorId,
          tags: {
            create: item.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
          previews: {
            create: item.previewUrls.map((imageUrl, order) => ({
              imageUrl,
              order,
            })),
          },
        },
      });

      created.push({ row: item.row, title: item.title, id: resource.id });
    }
  });

  return created;
}

export async function updateAdminResourceRecord(
  resourceId: string,
  input: UpdateAdminResourceRecordInput,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.resource.update({
      where: { id: resourceId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.status !== undefined && { status: input.status }),
        isFree: input.isFree,
        price: input.price,
        ...(input.fileUrl !== undefined && { fileUrl: input.fileUrl }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.level !== undefined && { level: input.level }),
        ...(input.license !== undefined && { license: input.license }),
        ...(input.visibility !== undefined && { visibility: input.visibility }),
        ...(input.authorId !== undefined && { authorId: input.authorId }),
        ...(input.previewUrl !== undefined && { previewUrl: input.previewUrl }),
      },
    });

    if (input.tagIds !== undefined) {
      await tx.resourceTag.deleteMany({ where: { resourceId } });

      const uniqueTagIds = Array.from(new Set(input.tagIds));
      if (uniqueTagIds.length > 0) {
        await tx.resourceTag.createMany({
          data: uniqueTagIds.map((tagId) => ({
            resourceId,
            tagId,
          })),
        });
      }
    }

    if (input.previewUrls !== undefined) {
      await tx.resourcePreview.deleteMany({ where: { resourceId } });

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

export async function softDeleteAdminResource(resourceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: { deletedAt: new Date() },
  });
}

export async function softDeleteAdminResources(resourceIds: string[]) {
  return prisma.resource.updateMany({
    where: { id: { in: resourceIds } },
    data: { deletedAt: new Date() },
  });
}

export async function moveAdminResourcesToCategory(
  resourceIds: string[],
  categoryId: string,
) {
  return prisma.resource.updateMany({
    where: { id: { in: resourceIds } },
    data: { categoryId },
  });
}

export async function updateAdminResourceStatuses(
  resourceIds: string[],
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  return prisma.resource.updateMany({
    where: { id: { in: resourceIds } },
    data: { status },
  });
}
