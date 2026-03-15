import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

type Params = { params: { id: string } };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session, error: null as NextResponse | null };
}

// PATCH /api/admin/resources/[id]/trash  → restore from trash
export async function PATCH(_req: Request, { params }: Params) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const existing = await prisma.resource.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    const restored = await prisma.resource.update({
      where: { id: params.id },
      data: { deletedAt: null },
    });

    await logActivity({
      userId: session.user.id,
      action: "resource_restored",
      entityType: "resource",
      entityId: params.id,
      meta: { title: restored.title },
    });

    // A restored PUBLISHED resource becomes visible in discover again.
    revalidateTag("discover");

    return NextResponse.json({ data: restored });
  } catch (err) {
    console.error("[ADMIN_RESOURCE_TRASH_PATCH]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/resources/[id]/trash  → hard delete (only for trashed items)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const existing = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { purchases: true, reviews: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Optionally enforce that only trashed resources can be permanently deleted
    if (!existing.deletedAt) {
      return NextResponse.json(
        { error: "Resource is not in trash." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { resourceId: params.id } }),
      prisma.purchase.deleteMany({ where: { resourceId: params.id } }),
      prisma.resource.delete({ where: { id: params.id } }),
    ]);

    await logActivity({
      userId: session.user.id,
      action: "resource_deleted_permanently",
      entityType: "resource",
      entityId: params.id,
      meta: { title: existing.title },
    });

    // Safety revalidation: ensures no stale reference remains in the cache.
    revalidateTag("discover");

    return NextResponse.json({
      data: {
        id: params.id,
        message: `"${existing.title}" was permanently deleted.`,
      },
    });
  } catch (err) {
    console.error("[ADMIN_RESOURCE_TRASH_DELETE]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

