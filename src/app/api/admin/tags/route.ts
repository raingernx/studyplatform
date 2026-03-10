import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

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

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// ── GET /api/admin/tags ───────────────────────────────────────────────────────

export async function GET() {
  const { ok, res } = await requireAdmin();
  if (!ok) return res!;

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: {
        id:     true,
        name:   true,
        slug:   true,
        _count: { select: { resources: true } },
      },
    });
    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error("[ADMIN_TAGS_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── POST /api/admin/tags ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { ok, res } = await requireAdmin();
  if (!ok) return res!;

  try {
    const body   = await req.json();
    const parsed = CreateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name } = parsed.data;
    const trimmed  = name.trim();
    const slug     = toSlug(trimmed);

    if (!slug) {
      return NextResponse.json(
        { error: "Tag name must contain at least one letter or number." },
        { status: 400 }
      );
    }

    const existing = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: { equals: trimmed, mode: "insensitive" } },
          { slug },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A tag named "${existing.name}" already exists.` },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({ data: { name: trimmed, slug } });
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_TAGS_POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
