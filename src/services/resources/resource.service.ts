import { findPublicResources } from "@/repositories/resources/resource.repository";

export interface ListPublicResourcesInput {
  page?: number;
  pageSize?: number;
  categorySlug?: string | null;
  tagSlug?: string | null;
  search?: string | null;
  isFree?: boolean;
}

export async function listPublicResources(input: ListPublicResourcesInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, input.pageSize ?? 12);
  const categorySlug = input.categorySlug?.trim() || undefined;
  const tagSlug = input.tagSlug?.trim() || undefined;
  const search = input.search?.trim() || undefined;

  const { items, total } = await findPublicResources({
    page,
    pageSize,
    categorySlug,
    tagSlug,
    search,
    isFree: input.isFree,
  });

  return {
    items: items.map((resource) => ({
      ...resource,
      previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
