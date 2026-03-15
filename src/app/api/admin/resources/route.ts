import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { logAdminAction } from "@/lib/auditLogger";

// ── Validation schema ─────────────────────────────────────────────────────────

const CreateResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["PDF", "DOCUMENT"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  isFree: z.boolean().default(false),
  price: z.number().int().min(0, "Price must be 0 or greater").default(0), // cents
  fileUrl: z
    .union([
      z.string().url("Must be a valid URL"),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => (val === "" || val == null ? undefined : val)),
  categoryId: z.string().cuid().nullable().optional(),
  featured: z.boolean().default(false),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
  license: z.enum(["PERSONAL_USE", "COMMERCIAL_USE", "EXTENDED_LICENSE"]).nullable().optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).nullable().optional(),
  authorId: z.string().cuid().optional(),
  // Array of tag IDs to associate with this resource (may be empty)
  tagIds: z.array(z.string().cuid()).default([]),
  // Array of preview image URLs or relative paths (e.g. /uploads/…)
  previewUrls: z
    .array(
      z.string().refine(
        (val) =>
          val.startsWith("http://") ||
          val.startsWith("https://") ||
          val.startsWith("/"),
        { message: "Preview must be a URL or uploaded image path (e.g. https://… or /uploads/…)" },
      ),
    )
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

    // ── 2. Ensure user exists and is ADMIN ──────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found. Please sign out and sign in again." },
        { status: 401 },
      );
    }

    const role = dbUser.role;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      );
    }

    // ── 3. Validate request body ────────────────────────────────────────────
    const body = await req.json();
    const parsed = CreateResourceSchema.safeParse(body);

    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
        if (messages && messages.length > 0) {
          fieldErrors[key] = messages[0] as string;
        }
      }
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: fieldErrors,
          // Keep detailed structure for any existing consumers
          errors: {
            fieldErrors: flattened.fieldErrors,
            formErrors: flattened.formErrors,
          },
        },
        { status: 400 },
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
      level,
      license,
      visibility,
      authorId,
      tagIds,
      previewUrls,
    } = parsed.data;

    // ── 4. Generate unique slug ─────────────────────────────────────────────
    const slug = await uniqueSlug(slugify(title));

    const firstPreviewUrl = previewUrls.length > 0 ? previewUrls[0] : null;

    // ── 5. Create resource + ResourceTag rows in one transaction ────────────
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
        level: level ?? null,
        license: license ?? null,
        visibility: visibility ?? null,
        previewUrl: firstPreviewUrl,
        authorId: authorId ?? session.user.id,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        previews: {
          create: previewUrls.map((imageUrl, i) => ({
            imageUrl,
            order: i,
          })),
        },
      },
    });

    await Promise.all([
      logActivity({
        userId: session.user.id,
        action: "resource_created",
        entityType: "resource",
        entityId: resource.id,
        meta: { title: resource.title },
      }),
      logAdminAction({
        adminId: session.user.id,
        action: "RESOURCE_CREATED",
        entityType: "resource",
        entityId: resource.id,
        metadata: { title: resource.title },
      }),
    ]);

    // Bust the discover page cache so the new resource appears immediately.
    revalidateTag("discover");

    return NextResponse.json({ success: true, data: resource }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
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
      where: { deletedAt: null },
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
      { status: 500 },
    );
  }
}
