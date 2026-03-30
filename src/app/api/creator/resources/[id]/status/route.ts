import { NextResponse } from "next/server";
import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import {
  CACHE_TAGS,
  deleteDiscoverRedisKeys,
  deleteMarketplaceRecommendedListingRedisKeys,
  deleteRelatedResourcesRedisKeys,
  deleteResourceRedisKeys,
  getCreatorPublicCacheTag,
  getResourceCacheTag,
} from "@/lib/cache";
import { warmTargetedPublicCaches } from "@/services/performance/public-cache-warm.service";
import {
  CreatorServiceError,
  getCreatorResourcePublicCacheTarget,
  updateCreatorResourceStatus,
} from "@/services/creator.service";

type Params = {
  params: Promise<{ id: string }>;
};

function handleCreatorError(error: unknown, label: string) {
  if (error instanceof CreatorServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(label, error);
    return NextResponse.json(
      { error: "Creator resource actions are temporarily unavailable because the database is not reachable." },
      { status: 503 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    console.error(label, error);
    return NextResponse.json(
      { error: "Failed to change this resource status due to a database error. Please try again." },
      { status: 500 },
    );
  }

  console.error(label, error);
  return NextResponse.json(
    { error: "Failed to change this resource status. Check the server logs for details." },
    { status: 500 },
  );
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const input = await req.json();
    const cacheTarget = await getCreatorResourcePublicCacheTarget(session.user.id, id);
    const result = await updateCreatorResourceStatus(session.user.id, id, input);
    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(CACHE_TAGS.creatorPublic, "max");
    revalidateTag(getCreatorPublicCacheTag(session.user.id), "max");
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
        trigger: "creator_resource_status_update",
        includeListings: true,
        resourceIds: input?.status === "PUBLISHED" ? [id] : [],
        includeTrustSummaries: input?.status === "PUBLISHED",
        creatorIdentifiers: [session.user.id],
      }).catch((error) => {
        console.error("[CREATOR_RESOURCE_STATUS_PATCH_WARM]", error);
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleCreatorError(error, "[CREATOR_RESOURCE_STATUS_PATCH]");
  }
}
