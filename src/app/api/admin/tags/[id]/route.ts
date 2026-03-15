import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false, res: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true, res: null };
}

// ── Schema ────────────────────────────────────────────────────────────────────

const PatchTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// ── PATCH /api/admin/tags/[id] ────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  const { ok, res } = await requireAdmin();
  if (!ok) return res!;

  try {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = PatchTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const trimmed = parsed.data.name.trim();
    const slug    = toSlug(trimmed);

    if (!slug) {
      return NextResponse.json(
        { error: "Tag name must contain at least one letter or number." },
        { status: 400 }
      );
    }

    // Uniqueness check — exclude the tag being edited
    const duplicate = await prisma.tag.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [{ name: { equals: trimmed, mode: "insensitive" } }, { slug }] },
        ],
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `A tag named "${duplicate.name}" already exists.` },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.update({ where: { id }, data: { name: trimmed, slug } });
    return NextResponse.json({ data: tag });
  } catch (err) {
    console.error("[ADMIN_TAGS_PATCH]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── DELETE /api/admin/tags/[id] ───────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const { ok, res } = await requireAdmin();
  if (!ok) return res!;

  try {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found." }, { status: 404 });
    }

    // Remove join rows first (foreign-key constraint)
    await prisma.resourceTag.deleteMany({ where: { tagId: id } });
    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("[ADMIN_TAGS_DELETE]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
