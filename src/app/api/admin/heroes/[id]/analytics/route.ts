import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHeroAnalytics, HeroServiceError } from "@/services/heroes/hero.service";

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

  console.error("[ADMIN_HERO_ANALYTICS_GET]", error);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.res;
  }

  try {
    const { id } = await params;
    const analytics = await getHeroAnalytics(id);
    return NextResponse.json(analytics);
  } catch (error) {
    return handleError(error);
  }
}
