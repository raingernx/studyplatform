import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { session };
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const admin = await requireAdmin();
    if ("error" in admin) {
      return admin.error;
    }

    const existing = await prisma.resource.findUnique({
      where: { id },
      include: {
        previews: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    const tagLinks = await prisma.resourceTag.findMany({
      where: { resourceId: id },
      select: { tagId: true },
    });
    const tagIds = tagLinks.map((t) => t.tagId);

    const baseTitle = existing.title.endsWith(" (Copy)")
      ? existing.title
      : `${existing.title} (Copy)`;

    const baseSlug = `${existing.slug}-copy`;
    let candidate = baseSlug;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const conflict = await prisma.resource.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!conflict) break;
      attempt += 1;
      candidate = `${baseSlug}-${attempt}`;
    }

    const firstPreviewUrl =
      existing.previews.length > 0 ? existing.previews[0].imageUrl : null;

    const duplicated = await prisma.resource.create({
      data: {
        title: baseTitle,
        slug: candidate,
        description: existing.description,
        type: existing.type,
        status: "DRAFT",
        isFree: existing.isFree,
        price: existing.price,
        fileUrl: existing.fileUrl,
        categoryId: existing.categoryId,
        featured: existing.featured,
        previewUrl: firstPreviewUrl,
        authorId: admin.session.user.id!,
        tags:
          tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
        previews:
          existing.previews.length > 0
            ? {
                create: existing.previews.map((p, i) => ({
                  imageUrl: p.imageUrl,
                  order: i,
                })),
              }
            : undefined,
      },
    });

    return NextResponse.json({ data: { id: duplicated.id } });
  } catch (err) {
    console.error("[ADMIN_RESOURCE_DUPLICATE]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
