import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// ── GET /api/resources/[id] ────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: true,
        tags: { include: { tag: true } },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { purchases: true, reviews: true } },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Increment view count (fire and forget)
    prisma.resource
      .update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    return NextResponse.json({ data: resource });
  } catch (err) {
    console.error("[RESOURCE_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── PATCH /api/resources/[id] ──────────────────────────────────────────────
const UpdateResourceSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFree: z.boolean().optional(),
  price: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  fileUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resource = await prisma.resource.findUnique({ where: { id: params.id } });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // @ts-expect-error – custom role
    const role = session.user.role as string;
    const isOwner = resource.authorId === session.user.id;
    if (role !== "ADMIN" && !isOwner) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.resource.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[RESOURCE_PATCH]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── DELETE /api/resources/[id] ──────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resource = await prisma.resource.findUnique({ where: { id: params.id } });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // @ts-expect-error – custom role
    const role = session.user.role as string;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete resources." }, { status: 403 });
    }

    await prisma.resource.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[RESOURCE_DELETE]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
