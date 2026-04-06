import { NextResponse } from "next/server";
import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { CACHE_TAGS, deleteDiscoverRedisKeys } from "@/lib/cache";
import { warmTargetedPublicCaches } from "@/services/performance/public-cache-warm.service";
import {
  createAdminResource,
  listAdminResources,
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

    const result = await createAdminResource(await req.json(), auth.session.user.id);
    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(CACHE_TAGS.creatorPublic, "max");
    await deleteDiscoverRedisKeys();
    if (result.data.status === "PUBLISHED") {
      after(() => {
        void warmTargetedPublicCaches({
          trigger: "admin_resource_create",
          includeListings: true,
          resourceTargets: [{ id: result.data.id, slug: result.data.slug }],
          creatorIdentifiers: [result.data.authorId],
        }).catch((error) => {
          console.error("[ADMIN_RESOURCES_POST_WARM]", error);
        });
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_POST]");
  }
}

export async function GET(_req: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const resources = await listAdminResources();

    return NextResponse.json({ data: resources });
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_GET]");
  }
}
