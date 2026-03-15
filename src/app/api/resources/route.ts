import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPublicResources } from "@/services/resources/resource.service";
import { slugify } from "@/lib/utils";

const previewMediaSchema = z.string().refine(
  (value) =>
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/"),
  {
    message:
      "Preview media must be a URL or uploaded image path (e.g. https://… or /uploads/…).",
  },
);

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

// ── POST /api/resources ───────────────────────────────────────────────────────
// Protected – ADMIN or INSTRUCTOR only
const CreateResourceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.string().cuid().optional(),
  isFree: z.boolean().default(false),
  price: z.number().int().min(0).default(0),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  previewUrl: previewMediaSchema.nullable().optional(),
  previewUrls: z.array(previewMediaSchema).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = session.user.role;
    if (!["ADMIN", "INSTRUCTOR"].includes(role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      categoryId,
      isFree,
      price,
      stripePriceId,
      stripeProductId,
      tagIds,
      previewUrl,
      previewUrls,
    } = parsed.data;

    const slug = slugify(title);
    const normalizedPreviewUrls = (previewUrls ?? []).filter((url) => url.trim() !== "");
    const primaryPreviewUrl = previewUrl ?? normalizedPreviewUrls[0] ?? null;

    // Ensure slug is unique
    const existing = await prisma.resource.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A resource with a similar title already exists. Choose a different title." },
        { status: 409 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        slug,
        description,
        isFree,
        price,
        stripePriceId,
        stripeProductId,
        categoryId,
        previewUrl: primaryPreviewUrl,
        authorId: session.user.id,
        tags: tagIds
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
        previews:
          normalizedPreviewUrls.length > 0
            ? {
                create: normalizedPreviewUrls.map((imageUrl, order) => ({
                  imageUrl,
                  order,
                })),
              }
            : undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (err) {
    console.error("[RESOURCES_POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
