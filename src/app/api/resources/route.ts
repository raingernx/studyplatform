import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  RANKING_EXPERIMENT_COOKIE,
  isValidRankingVariant,
  variantToSort,
} from "@/lib/ranking-experiment";
import {
  createOwnedResource,
  getMarketplaceResources,
  listPublicResources,
} from "@/services/resources/public-resource-read.service";
import { ResourceServiceError } from "@/services/resources/resource.service";

function handleServiceError(err: unknown, label: string) {
  if (err instanceof ResourceServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error(label, err);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

// ── GET /api/resources ────────────────────────────────────────────────────────
// Public – returns published resources with optional filtering + pagination
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "12", 10));
    const categorySlug = searchParams.get("category");
    const tagSlug = searchParams.get("tag");
    const search = searchParams.get("search") ?? searchParams.get("q");
    const price = searchParams.get("price")
      ?? (searchParams.get("free") === "true" ? "free" : "");
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") ?? "newest";
    const cookieVariant = req.headers.get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${RANKING_EXPERIMENT_COOKIE}=`))
      ?.split("=")[1];
    const effectiveSort = variantToSort(
      isValidRankingVariant(cookieVariant) ? cookieVariant : null,
    );

    const shouldUseMarketplaceListing =
      categorySlug !== null ||
      tagSlug !== null ||
      Boolean(search) ||
      Boolean(price) ||
      featured ||
      sort !== "newest";

    const data = shouldUseMarketplaceListing
      ? await getMarketplaceResources({
          search: search ?? undefined,
          category: categorySlug ?? undefined,
          price,
          featured,
          tag: tagSlug ?? undefined,
          sort,
          page,
          pageSize,
        })
      : await listPublicResources({
          page,
          pageSize,
          categorySlug,
          tagSlug,
          search: search ?? undefined,
          isFree: searchParams.get("free") === "true" ? true : undefined,
        });

    return NextResponse.json({
      data: "resources" in data
        ? {
            ...data,
            items: data.resources,
            effectiveSort,
          }
        : data,
    });
  } catch (err) {
    console.error("[RESOURCES_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await createOwnedResource(await req.json(), session.user.id);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleServiceError(err, "[RESOURCES_POST]");
  }
}
