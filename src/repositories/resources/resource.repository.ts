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

const RESOURCE_LIST_INCLUDE = {
  author: { select: { id: true, name: true, image: true } },
  category: true,
  tags: { include: { tag: true } },
  previews: { orderBy: { order: "asc" as const }, select: { imageUrl: true } },
  _count: { select: { purchases: true, reviews: true } },
} as const;

export async function findPublicResources(params: FindPublicResourcesParams) {
  const { page, pageSize, categorySlug, tagSlug, search, isFree } = params;

  const where = {
    ...LISTED_RESOURCE_WHERE,
    ...(categorySlug && { category: { slug: categorySlug } }),
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
      include: RESOURCE_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  return { items, total };
}
