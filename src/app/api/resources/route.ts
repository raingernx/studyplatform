import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createOwnedResource,
  listPublicResources,
  ResourceServiceError,
} from "@/services/resources/resource.service";

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
    const search = searchParams.get("q");
    const isFree = searchParams.get("free") === "true" ? true : undefined;
    const data = await listPublicResources({
      page,
      pageSize,
      categorySlug,
      tagSlug,
      search,
      isFree,
    });

    return NextResponse.json({
      data,
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
