import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Validation schema ─────────────────────────────────────────────────────────

const CreateResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["PDF", "DOCUMENT"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  isFree: z.boolean().default(false),
  price: z.number().int().min(0, "Price must be 0 or greater").default(0), // cents
  fileUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  categoryId: z.string().cuid().nullable().optional(),
  featured: z.boolean().default(false),
  // Array of tag IDs to associate with this resource (may be empty)
  tagIds: z.array(z.string().cuid()).default([]),
  // Array of preview image URLs (stored in order)
  previewUrls: z
    .array(z.string().url("Each preview must be a valid URL"))
    .default([]),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a title to a URL-safe slug */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Find a unique slug by appending -1, -2, … if the base slug is already taken.
 */
async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.resource.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

// ── POST /api/admin/resources ─────────────────────────────────────────────────

/**
 * Create a new resource.
 *
 * Responses:
 *   201  Resource created successfully
 *   400  Validation error
 *   401  Not authenticated
 *   403  Not an ADMIN
 *   500  Unexpected server error
 */
export async function POST(req: Request) {
  try {
    // ── 1. Require authentication ───────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // ── 2. Require ADMIN role ───────────────────────────────────────────────
    const role = session.user.role;

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // ── 3. Validate request body ────────────────────────────────────────────
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
      type,
      status,
      isFree,
      price,
      fileUrl,
      categoryId,
      featured,
      tagIds,
      previewUrls,
    } = parsed.data;

    // ── 4. Generate unique slug ─────────────────────────────────────────────
    const slug = await uniqueSlug(slugify(title));

    // ── 5. Create resource + ResourceTag rows in one transaction ────────────
    // Using a nested create so all rows land atomically.
    const resource = await prisma.resource.create({
      data: {
        title,
        slug,
        description,
        type,
        status,
        isFree: isFree || price === 0,
        price: isFree ? 0 : price,
        fileUrl: fileUrl ?? null,
        categoryId: categoryId ?? null,
        featured,
        authorId: session.user.id,
        // Create one ResourceTag join row per selected tag ID
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        // Create preview image rows in order
        previews: {
          create: previewUrls.map((imageUrl, i) => ({
            imageUrl,
            order: i,
          })),
        },
      },
    });

    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── GET /api/admin/resources ──────────────────────────────────────────────────

/**
 * List all resources (admin view, no status filter).
 *
 * Responses:
 *   200  Array of resources
 *   401  Not authenticated
 *   403  Not an ADMIN
 *   500  Unexpected server error
 */
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = session.user.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const resources = await prisma.resource.findMany({
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: resources });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
