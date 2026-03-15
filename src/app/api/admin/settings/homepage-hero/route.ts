import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateHeroSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  primaryCtaText: z.string().min(1, "Primary CTA text is required"),
  primaryCtaLink: z.string().min(1, "Primary CTA link is required"),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  badgeText: z.string().optional(),
  imageUrl: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["image", "gif"]).optional(),
});

export type HomepageHeroPayload = z.infer<typeof UpdateHeroSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const };
}

/**
 * GET /api/admin/settings/homepage-hero
 * Returns the first HomepageHero record or null. Admin only.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    const hero = await prisma.homepageHero.findFirst({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(hero);
  } catch (err) {
    console.error("[ADMIN_HOMEPAGE_HERO_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings/homepage-hero
 * Create or update the single hero config (upsert first record). Admin only.
 */
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = UpdateHeroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const payload = {
    title: data.title,
    subtitle: data.subtitle,
    primaryCtaText: data.primaryCtaText,
    primaryCtaLink: data.primaryCtaLink,
    secondaryCtaText: data.secondaryCtaText ?? null,
    secondaryCtaLink: data.secondaryCtaLink ?? null,
    badgeText: data.badgeText ?? null,
    imageUrl: data.imageUrl && data.imageUrl !== "" ? data.imageUrl : null,
    mediaUrl: data.mediaUrl && data.mediaUrl !== "" ? data.mediaUrl : null,
    mediaType: data.mediaType ?? null,
  };

  try {
    const existing = await prisma.homepageHero.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const hero = existing
      ? await prisma.homepageHero.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.homepageHero.create({
          data: payload,
        });

    return NextResponse.json(hero);
  } catch (err) {
    console.error("[ADMIN_HOMEPAGE_HERO_PATCH]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
