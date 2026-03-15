import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Helpers ─────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

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

// ── POST /api/admin/resources/draft ─────────────────────────────────────────────

/**
 * Create an empty draft resource so that uploads can be attached immediately.
 *
 * Responses:
 *   201  Draft created successfully
 *   401  Not authenticated
 *   403  Not an ADMIN
 */
export async function POST(_req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      );
    }

    // Cleanup: remove empty, stale drafts older than 24 hours to prevent spam.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.resource.deleteMany({
      where: {
        title: "",
        description: "",
        fileUrl: null,
        fileKey: null,
        status: "DRAFT",
        createdAt: {
          lt: cutoff,
        },
      },
    });

    const title = "Untitled draft";
    const baseSlug = slugify(title) || "draft-resource";
    const slug = await uniqueSlug(baseSlug);

    const resource = await prisma.resource.create({
      data: {
        title,
        slug,
        description: "",
        type: "PDF",
        status: "DRAFT",
        isFree: true,
        price: 0,
        fileUrl: null,
        categoryId: null,
        featured: false,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ id: resource.id }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_RESOURCES_DRAFT_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

