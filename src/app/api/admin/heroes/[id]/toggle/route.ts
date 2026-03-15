import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { HeroServiceError, updateHero } from "@/services/heroes/hero.service";

const ToggleHeroSchema = z.object({
  isActive: z.boolean(),
});

type Params = {
  params: Promise<{ id: string }>;
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  if (session.user.role !== "ADMIN") {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }
  return { ok: true as const };
}

function handleError(error: unknown) {
  if (error instanceof HeroServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  console.error("[ADMIN_HERO_TOGGLE_PATCH]", error);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.res;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = ToggleHeroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: {
          isActive: parsed.error.flatten().fieldErrors.isActive?.[0] ?? "isActive is required.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const hero = await updateHero(id, {
      isActive: parsed.data.isActive,
    });

    return NextResponse.json({ hero });
  } catch (error) {
    return handleError(error);
  }
}
