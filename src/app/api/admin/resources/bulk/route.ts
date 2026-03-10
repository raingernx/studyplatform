import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Per-item validation schema ────────────────────────────────────────────────

const BulkItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  // price in cents; 0 = free
  price: z.number().int().min(0, "Price must be 0 or greater").default(0),
  categorySlug: z.string().optional().nullable(),
  tagSlugs: z.array(z.string()).default([]),
  previewUrls: z
    .array(z.string().url("Each preview must be a valid URL"))
    .default([]),
  fileUrl: z
    .string()
    .url("fileUrl must be a valid URL")
    .nullable()
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
  type: z.enum(["PDF", "DOCUMENT"]).default("PDF"),
  featured: z.boolean().default(false),
});

// ── Top-level request schema ──────────────────────────────────────────────────

const BulkRequestSchema = z.object({
  resources: z
    .array(z.unknown())
    .min(1, "Provide at least one resource")
    .max(100, "Maximum 100 resources per batch"),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Find a unique slug by checking both the DB and any slugs already allocated
 * to earlier items within this batch (which haven't been committed yet).
 */
async function uniqueSlugForBatch(
  title: string,
  batchSlugs: Set<string>
): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!batchSlugs.has(candidate)) {
      const existing = await prisma.resource.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) {
        batchSlugs.add(candidate);
        return candidate;
      }
    }
    attempt++;
    candidate = `${base}-${attempt}`;
  }
}

// ── POST /api/admin/resources/bulk ────────────────────────────────────────────

/**
 * Bulk-create resources from a JSON array.
 *
 * Request body: { resources: BulkItemInput[] }
 *
 * Each item is validated independently. Items that fail validation or whose
 * category / tags cannot be resolved are reported in the `errors` array but
 * do not block valid items.
 *
 * All valid items are created inside a single Prisma transaction so the
 * successful portion is committed atomically.
 *
 * Responses:
 *   200  { data: { success, failed, created[], errors[] } }
 *   400  Request-level validation failure
 *   401  Not authenticated
 *   403  Not an ADMIN
 *   500  Unexpected server error
 */
export async function POST(req: Request) {
  try {
    // ── 1. Auth guard ───────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = session.user.role;

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // ── 2. Parse top-level body ─────────────────────────────────────────────
    const body = await req.json();
    const topLevel = BulkRequestSchema.safeParse(body);

    if (!topLevel.success) {
      return NextResponse.json(
        { error: topLevel.error.errors[0].message },
        { status: 400 }
      );
    }

    const { resources: rawItems } = topLevel.data;

    // ── 3. Validate and resolve each item ───────────────────────────────────
    //
    // Phase 1 runs outside the transaction so we can make individual DB
    // look-ups for categories and tags without affecting the transaction
    // isolation level. Items that fail here are skipped and reported.

    type ValidItem = {
      row: number;
      title: string;
      description: string;
      price: number;
      type: "PDF" | "DOCUMENT";
      status: "DRAFT" | "PUBLISHED";
      featured: boolean;
      isFree: boolean;
      fileUrl: string | null;
      categoryId: string | null;
      tagIds: string[];
      previewUrls: string[];
      slug: string;
    };

    const validItems: ValidItem[] = [];
    const errors: { row: number; title?: string; message: string }[] = [];
    // Track slugs allocated to this batch to avoid intra-batch collisions
    const batchSlugs = new Set<string>();

    for (let i = 0; i < rawItems.length; i++) {
      const row = i + 1; // 1-indexed for user-facing messages
      const raw = rawItems[i];
      const rawTitle = (raw as Record<string, unknown>)?.title as
        | string
        | undefined;

      // ── 3a. Zod validation ────────────────────────────────────────────────
      const parsed = BulkItemSchema.safeParse(raw);

      if (!parsed.success) {
        errors.push({
          row,
          title: rawTitle,
          message: parsed.error.errors[0].message,
        });
        continue;
      }

      const item = parsed.data;

      // ── 3b. Resolve category by slug ──────────────────────────────────────
      let categoryId: string | null = null;

      if (item.categorySlug) {
        const category = await prisma.category.findUnique({
          where: { slug: item.categorySlug },
          select: { id: true },
        });

        if (!category) {
          errors.push({
            row,
            title: item.title,
            message: `Category not found: "${item.categorySlug}"`,
          });
          continue;
        }

        categoryId = category.id;
      }

      // ── 3c. Resolve tags by slug ──────────────────────────────────────────
      const tagIds: string[] = [];
      let tagError = false;

      for (const slug of item.tagSlugs) {
        const tag = await prisma.tag.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!tag) {
          errors.push({
            row,
            title: item.title,
            message: `Tag not found: "${slug}"`,
          });
          tagError = true;
          break;
        }

        tagIds.push(tag.id);
      }

      if (tagError) continue;

      // ── 3d. Generate a unique slug for this resource ───────────────────────
      const slug = await uniqueSlugForBatch(item.title, batchSlugs);

      validItems.push({
        row,
        title: item.title,
        description: item.description,
        price: item.price,
        type: item.type,
        status: item.status,
        featured: item.featured,
        isFree: item.price === 0,
        fileUrl: item.fileUrl ?? null,
        categoryId,
        tagIds,
        previewUrls: item.previewUrls,
        slug,
      });
    }

    // ── 4. Create all valid items in one transaction ────────────────────────
    //
    // Using the interactive transaction form so each resource's tags and
    // previews can be written atomically alongside the resource row.
    // If any DB-level error occurs, the entire successful portion rolls back.

    const created: { row: number; title: string; id: string }[] = [];

    if (validItems.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const item of validItems) {
          const resource = await tx.resource.create({
            data: {
              title: item.title,
              slug: item.slug,
              description: item.description,
              type: item.type,
              status: item.status,
              isFree: item.isFree,
              price: item.price,
              fileUrl: item.fileUrl,
              categoryId: item.categoryId,
              featured: item.featured,
              authorId: session.user.id!,
              // One ResourceTag join row per resolved tag
              tags: {
                create: item.tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              },
              // Preview image rows in order
              previews: {
                create: item.previewUrls.map((imageUrl, idx) => ({
                  imageUrl,
                  order: idx,
                })),
              },
            },
          });

          created.push({ row: item.row, title: item.title, id: resource.id });
        }
      });
    }

    // ── 5. Return structured result ─────────────────────────────────────────
    return NextResponse.json({
      data: {
        success: created.length,
        failed: errors.length,
        created,
        errors,
      },
    });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_BULK_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
