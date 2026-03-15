import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { logAdminAction } from "@/lib/auditLogger";

// ── Types ─────────────────────────────────────────────────────────────────────

type Params = { params: Promise<{ id: string }> };

// ── Auth guard helper ─────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const role = session.user.role;

  if (role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 }) };
  }

  return { session, error: null };
}

async function ensureUniqueSlugForUpdate(
  slug: string,
  resourceId: string,
): Promise<string> {
  const base = slug;
  let candidate = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.resource.findUnique({
      where: { slug: candidate },
    });

    if (!existing || existing.id === resourceId) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

// ── Validation schema (all fields optional for partial update) ────────────────

const PatchResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80, "Slug must be at most 80 characters")
    .optional(),
  type: z.enum(["PDF", "DOCUMENT"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFree: z.boolean().optional(),
  price: z.number().int().min(0).optional(), // cents
  fileUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  categoryId: z.string().cuid().nullable().optional(),
  featured: z.boolean().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
  license: z.enum(["PERSONAL_USE", "COMMERCIAL_USE", "EXTENDED_LICENSE"]).nullable().optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED"]).nullable().optional(),
  authorId: z.string().cuid().optional(),
  // When present, replaces the full tag set.  Omit the field to leave tags unchanged.
  tagIds: z.array(z.string().cuid()).optional(),
  // When present, replaces all preview images. Omit to leave previews unchanged.
  previewUrls: z
    .array(
      z.string().refine(
        (val) =>
          val.startsWith("http://") ||
          val.startsWith("https://") ||
          val.startsWith("/"),
        { message: "Preview must be a URL or uploaded image path (e.g. https://… or /uploads/…)" }
      )
    )
    .optional(),
});

// ── PATCH /api/admin/resources/[id] ──────────────────────────────────────────

/**
 * Partially update a resource.
 *
 * Responses:
 *   200  Updated resource
 *   400  Validation error
 *   401  Not authenticated
 *   403  Not an ADMIN
 *   404  Resource not found
 *   500  Unexpected server error
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    // Confirm the resource exists
    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Validate body
    const body = await req.json();
    const parsed = PatchResourceSchema.safeParse(body);

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
        },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      slug,
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

    // If isFree is being set to true, force price to 0
    const resolvedIsFree = isFree ?? existing.isFree;
    const resolvedPrice  = resolvedIsFree ? 0 : (price ?? existing.price);

    const resolvedSlug =
      slug !== undefined
        ? await ensureUniqueSlugForUpdate(slug, id)
        : undefined;

    // When previewUrls is sent, use first URL as resource.previewUrl so card/display resolve correctly
    const firstPreviewUrl =
      previewUrls !== undefined
        ? previewUrls.filter((u) => u.trim() !== "")[0] ?? null
        : undefined;

    const resourceUpdateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(resolvedSlug !== undefined && { slug: resolvedSlug }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      isFree: resolvedIsFree,
      price: resolvedPrice,
      ...(fileUrl !== undefined && { fileUrl }),
      ...(categoryId !== undefined && { categoryId }),
      ...(featured !== undefined && { featured }),
      ...(level !== undefined && { level }),
      ...(license !== undefined && { license }),
      ...(visibility !== undefined && { visibility }),
      ...(authorId !== undefined && { authorId }),
      ...(firstPreviewUrl !== undefined && { previewUrl: firstPreviewUrl }),
    };

    // Run everything in a single interactive transaction.
    // If any step fails the whole operation rolls back — no partial state.
    const resource = await prisma.$transaction(async (tx) => {
      // 1. Always update the resource's scalar fields
      const updated = await tx.resource.update({
        where: { id },
        data: resourceUpdateData,
      });

      // 2. Replace tags when tagIds is present in the payload
      if (tagIds !== undefined) {
        const uniqueTagIds = Array.from(new Set(tagIds));
        await tx.resourceTag.deleteMany({ where: { resourceId: id } });
        if (uniqueTagIds.length > 0) {
          await tx.resourceTag.createMany({
            data: uniqueTagIds.map((tagId) => ({
              resourceId: id,
              tagId,
            })),
          });
        }
      }

      // 3. Replace previews when previewUrls is present in the payload
      if (previewUrls !== undefined) {
        const validUrls = previewUrls.filter((u) => u.trim() !== "");
        await tx.resourcePreview.deleteMany({ where: { resourceId: id } });
        if (validUrls.length > 0) {
          await tx.resourcePreview.createMany({
            data: validUrls.map((imageUrl, i) => ({
              resourceId: id,
              imageUrl,
              order: i,
            })),
          });
        }
      }

      return updated;
    });

    const action =
      status && status !== existing.status
        ? status === "PUBLISHED"
          ? "resource_published"
          : status === "ARCHIVED"
            ? "resource_archived"
            : "resource_updated"
        : "resource_updated";

    await Promise.all([
      logActivity({
        userId: session.user.id,
        action,
        entityType: "resource",
        entityId: id,
        meta: { title: resource.title },
      }),
      logAdminAction({
        adminId: session.user.id,
        action:
          action === "resource_published"
            ? "RESOURCE_PUBLISHED"
            : action === "resource_archived"
              ? "RESOURCE_ARCHIVED"
              : "RESOURCE_UPDATED",
        entityType: "resource",
        entityId: id,
        metadata: { title: resource.title },
      }),
    ]);

    // Bust the discover cache on any mutation — status, featured flag,
    // content, or pricing changes all affect what the discover page shows.
    revalidateTag("discover");

    return NextResponse.json({ data: resource });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_PATCH]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── DELETE /api/admin/resources/[id] ─────────────────────────────────────────

/**
 * Permanently delete a resource and all related data.
 *
 * Deletes in dependency order inside a transaction:
 *   reviews → purchases → resource
 * (ResourceTag rows are cascade-deleted by the DB.)
 *
 * Responses:
 *   200  Deletion successful
 *   401  Not authenticated
 *   403  Not an ADMIN
 *   404  Resource not found
 *   500  Unexpected server error
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    // Confirm the resource exists
    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Soft delete: mark the resource as trashed via deletedAt timestamp.
    const trashed = await prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await Promise.all([
      logActivity({
        userId: session.user.id,
        action: "resource_deleted",
        entityType: "resource",
        entityId: id,
        meta: { title: trashed.title, deletedAt: trashed.deletedAt },
      }),
      logAdminAction({
        adminId: session.user.id,
        action: "RESOURCE_DELETED",
        entityType: "resource",
        entityId: id,
        metadata: { title: trashed.title },
      }),
    ]);

    // Soft-deleted resources disappear from discover listings immediately.
    revalidateTag("discover");

    return NextResponse.json({
      data: {
        id,
        message: `"${trashed.title}" was moved to trash.`,
      },
    });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_DELETE]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
