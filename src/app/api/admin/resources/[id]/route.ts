import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

type Params = { params: { id: string } };

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

// ── Validation schema (all fields optional for partial update) ────────────────

const PatchResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
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
  // When present, replaces the full tag set.  Omit the field to leave tags unchanged.
  tagIds: z.array(z.string().cuid()).optional(),
  // When present, replaces all preview images. Omit to leave previews unchanged.
  previewUrls: z
    .array(z.string().url("Each preview must be a valid URL"))
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
    const { error } = await requireAdmin();
    if (error) return error;

    // Confirm the resource exists
    const existing = await prisma.resource.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Validate body
    const body = await req.json();
    const parsed = PatchResourceSchema.safeParse(body);

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

    // If isFree is being set to true, force price to 0
    const resolvedIsFree = isFree ?? existing.isFree;
    const resolvedPrice  = resolvedIsFree ? 0 : (price ?? existing.price);

    // Build the base resource update
    const resourceUpdateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      isFree: resolvedIsFree,
      price: resolvedPrice,
      ...(fileUrl !== undefined && { fileUrl }),
      ...(categoryId !== undefined && { categoryId }),
      ...(featured !== undefined && { featured }),
    };

    // Run everything in a single interactive transaction.
    // If any step fails the whole operation rolls back — no partial state.
    const resource = await prisma.$transaction(async (tx) => {
      // 1. Always update the resource's scalar fields
      const updated = await tx.resource.update({
        where: { id: params.id },
        data: resourceUpdateData,
      });

      // 2. Replace tags when tagIds is present in the payload
      if (tagIds !== undefined) {
        const uniqueTagIds = Array.from(new Set(tagIds));
        await tx.resourceTag.deleteMany({ where: { resourceId: params.id } });
        if (uniqueTagIds.length > 0) {
          await tx.resourceTag.createMany({
            data: uniqueTagIds.map((tagId) => ({
              resourceId: params.id,
              tagId,
            })),
          });
        }
      }

      // 3. Replace previews when previewUrls is present in the payload
      if (previewUrls !== undefined) {
        const validUrls = previewUrls.filter((u) => u.trim() !== "");
        await tx.resourcePreview.deleteMany({ where: { resourceId: params.id } });
        if (validUrls.length > 0) {
          await tx.resourcePreview.createMany({
            data: validUrls.map((imageUrl, i) => ({
              resourceId: params.id,
              imageUrl,
              order: i,
            })),
          });
        }
      }

      return updated;
    });

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
    const { error } = await requireAdmin();
    if (error) return error;

    // Confirm the resource exists
    const existing = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { purchases: true, reviews: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Delete related rows in dependency order, then the resource itself.
    // ResourceTag rows are handled automatically by the DB cascade.
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { resourceId: params.id } }),
      prisma.purchase.deleteMany({ where: { resourceId: params.id } }),
      prisma.resource.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({
      data: {
        id: params.id,
        message: `"${existing.title}" was permanently deleted.`,
      },
    });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_DELETE]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
