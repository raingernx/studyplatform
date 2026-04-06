import { NextResponse } from "next/server";
import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import {
  CACHE_TAGS,
  deleteDiscoverRedisKeys,
  deleteMarketplaceRecommendedListingRedisKeys,
  deleteRelatedResourcesRedisKeys,
  deleteResourceRedisKeys,
  getResourceCacheTag,
} from "@/lib/cache";
import { warmTargetedPublicCaches } from "@/services/performance/public-cache-warm.service";
import {
  getAdminResourcePublicCacheTarget,
  ResourceServiceError,
  trashAdminResource,
  updateAdminResource,
} from "@/services/resources/resource.service";

type Params = { params: Promise<{ id: string }> };

function handleServiceError(err: unknown, label: string) {
  if (err instanceof ResourceServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error(label, err);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const previousCacheTarget = await getAdminResourcePublicCacheTarget(id);
    const result = await updateAdminResource(id, await req.json(), auth.session.user.id);
    const currentCacheTarget = await getAdminResourcePublicCacheTarget(result.data.id);
    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(CACHE_TAGS.creatorPublic, "max");
    revalidateTag(getResourceCacheTag(result.data.slug), "max");
    if (previousCacheTarget && previousCacheTarget.slug !== result.data.slug) {
      revalidateTag(getResourceCacheTag(previousCacheTarget.slug), "max");
    }
    await Promise.all([
      deleteDiscoverRedisKeys(),
      deleteMarketplaceRecommendedListingRedisKeys([
        previousCacheTarget?.categorySlug,
        currentCacheTarget?.categorySlug,
      ]),
      deleteRelatedResourcesRedisKeys(id, [
        previousCacheTarget?.categoryId,
        currentCacheTarget?.categoryId ?? result.data.categoryId,
      ]),
      ...(previousCacheTarget && previousCacheTarget.slug !== result.data.slug
        ? [deleteResourceRedisKeys(previousCacheTarget.slug)]
        : []),
      deleteResourceRedisKeys(result.data.slug),
    ]);
    after(() => {
      void warmTargetedPublicCaches({
        trigger: "admin_resource_update",
        includeListings: true,
        resourceTargets:
          result.data.status === "PUBLISHED"
            ? [{ id: result.data.id, slug: result.data.slug }]
            : [],
        creatorIdentifiers: [result.data.authorId],
      }).catch((error) => {
        console.error("[ADMIN_RESOURCES_PATCH_WARM]", error);
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_PATCH]");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const cacheTarget = await getAdminResourcePublicCacheTarget(id);
    const result = await trashAdminResource(id, auth.session.user.id);
    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(CACHE_TAGS.creatorPublic, "max");
    if (cacheTarget) {
      revalidateTag(getResourceCacheTag(cacheTarget.slug), "max");
    }
    await Promise.all([
      deleteDiscoverRedisKeys(),
      deleteMarketplaceRecommendedListingRedisKeys([cacheTarget?.categorySlug]),
      ...(cacheTarget
        ? [
            deleteRelatedResourcesRedisKeys(cacheTarget.id, [cacheTarget.categoryId]),
            deleteResourceRedisKeys(cacheTarget.slug),
          ]
        : []),
    ]);
    after(() => {
      void warmTargetedPublicCaches({
        trigger: "admin_resource_trash",
        includeListings: true,
      }).catch((error) => {
        console.error("[ADMIN_RESOURCES_DELETE_WARM]", error);
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_DELETE]");
  }
}
