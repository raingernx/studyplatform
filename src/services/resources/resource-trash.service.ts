import { revalidateTag } from "next/cache";
import { logActivity } from "@/lib/activity";
import {
  CACHE_TAGS,
  deleteDiscoverRedisKeys,
  deleteMarketplaceRecommendedListingRedisKeys,
  deleteRelatedResourcesRedisKeys,
  deleteResourceRedisKeys,
  getResourceCacheTag,
} from "@/lib/cache";
import {
  findResourcePublicCacheTargetById,
  permanentlyDeleteAdminResource,
  restoreAdminResource,
} from "@/repositories/resources/resource.repository";

export class ResourceTrashServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Resource trash service error");
    this.status = status;
    this.payload = payload;
  }
}

interface ResourceTrashInput {
  resourceId: string;
  adminUserId: string;
}

export async function restoreTrashedResource(input: ResourceTrashInput) {
  const existing = await findResourcePublicCacheTargetById(input.resourceId);
  if (!existing) {
    throw new ResourceTrashServiceError(404, {
      error: "Resource not found.",
    });
  }

  const restored = await restoreAdminResource(input.resourceId);

  await logActivity({
    userId: input.adminUserId,
    action: "resource_restored",
    entityType: "resource",
    entityId: input.resourceId,
    meta: { title: restored.title },
  });

  revalidateTag(CACHE_TAGS.discover, "max");
  revalidateTag(CACHE_TAGS.creatorPublic, "max");
  revalidateTag(getResourceCacheTag(existing.slug), "max");
  await Promise.all([
    deleteDiscoverRedisKeys(),
    deleteMarketplaceRecommendedListingRedisKeys([existing.category?.slug]),
    deleteRelatedResourcesRedisKeys(existing.id, [existing.categoryId]),
    deleteResourceRedisKeys(existing.slug),
  ]);

  return restored;
}

export async function permanentlyDeleteTrashedResource(
  input: ResourceTrashInput,
) {
  const existing = await findResourcePublicCacheTargetById(input.resourceId);
  if (!existing) {
    throw new ResourceTrashServiceError(404, {
      error: "Resource not found.",
    });
  }

  if (!existing.deletedAt) {
    throw new ResourceTrashServiceError(400, {
      error: "Resource is not in trash.",
    });
  }

  await permanentlyDeleteAdminResource(input.resourceId);

  await logActivity({
    userId: input.adminUserId,
    action: "resource_deleted_permanently",
    entityType: "resource",
    entityId: input.resourceId,
    meta: { title: existing.title },
  });

  revalidateTag(CACHE_TAGS.discover, "max");
  revalidateTag(CACHE_TAGS.creatorPublic, "max");
  revalidateTag(getResourceCacheTag(existing.slug), "max");
  await Promise.all([
    deleteDiscoverRedisKeys(),
    deleteMarketplaceRecommendedListingRedisKeys([existing.category?.slug]),
    deleteRelatedResourcesRedisKeys(existing.id, [existing.categoryId]),
    deleteResourceRedisKeys(existing.slug),
  ]);

  return {
    id: input.resourceId,
    message: `"${existing.title}" was permanently deleted.`,
  };
}
