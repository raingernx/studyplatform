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
  createAdminResourcesInBulk,
  getAdminResourcePublicCacheTargets,
  mutateAdminResourcesInBulk,
  ResourceServiceError,
} from "@/services/resources/resource.service";

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

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const result = await createAdminResourcesInBulk(await req.json(), auth.session.user.id);

    if (result.data.success > 0) {
      revalidateTag(CACHE_TAGS.discover, "max");
      revalidateTag(CACHE_TAGS.creatorPublic, "max");
      await deleteDiscoverRedisKeys();
      after(() => {
        void warmTargetedPublicCaches({
          trigger: "admin_resource_bulk_create",
          includeListings: true,
        }).catch((error) => {
          console.error("[ADMIN_RESOURCES_BULK_POST_WARM]", error);
        });
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_BULK_POST]");
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const targetIds = Array.isArray((body as { ids?: unknown })?.ids)
      ? ((body as { ids: unknown[] }).ids.filter(
          (value): value is string => typeof value === "string",
        ))
      : [];
    const action =
      typeof (body as { action?: unknown })?.action === "string"
        ? (body as { action: string }).action
        : null;
    const previousCacheTargets = await getAdminResourcePublicCacheTargets(targetIds);
    const result = await mutateAdminResourcesInBulk(body);
    const currentCacheTargets =
      action === "publish" || action === "moveToCategory"
        ? await getAdminResourcePublicCacheTargets(targetIds)
        : [];

    if (result.data.updated > 0 || result.data.deleted > 0) {
      revalidateTag(CACHE_TAGS.discover, "max");
      revalidateTag(CACHE_TAGS.creatorPublic, "max");
      previousCacheTargets.forEach((target) => {
        revalidateTag(getResourceCacheTag(target.slug), "max");
      });
      await Promise.all([
        deleteDiscoverRedisKeys(),
        deleteMarketplaceRecommendedListingRedisKeys([
          ...previousCacheTargets.map((target) => target.categorySlug),
          ...currentCacheTargets.map((target) => target.categorySlug),
        ]),
        ...previousCacheTargets.map((target) =>
          Promise.all([
            deleteRelatedResourcesRedisKeys(target.id, [target.categoryId]),
            deleteResourceRedisKeys(target.slug),
          ]),
        ),
      ]);
      after(() => {
        void warmTargetedPublicCaches({
          trigger: "admin_resource_bulk_patch",
          includeListings: true,
          resourceTargets:
            action === "publish" || action === "moveToCategory"
              ? currentCacheTargets.map((target) => ({ id: target.id, slug: target.slug }))
              : [],
        }).catch((error) => {
          console.error("[ADMIN_RESOURCES_BULK_PATCH_WARM]", error);
        });
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_BULK_PATCH]");
  }
}
