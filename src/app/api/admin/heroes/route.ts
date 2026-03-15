import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  createHero,
  getHeroList,
  HeroServiceError,
  updateHero,
} from "@/services/heroes/hero.service";

const heroTypeSchema = z.enum(["featured", "promotion", "seasonal", "search", "fallback"]);

const HeroCreateSchema = z.object({
  name: z.string().min(1, "Name is required."),
  type: heroTypeSchema,
  title: z.string().min(1, "Title is required."),
  subtitle: z.string().nullable().optional(),
  badgeText: z.string().nullable().optional(),
  primaryCtaText: z.string().min(1, "Primary CTA text is required."),
  primaryCtaLink: z.string().min(1, "Primary CTA link is required."),
  secondaryCtaText: z.string().nullable().optional(),
  secondaryCtaLink: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  mediaType: z.enum(["image", "gif"]).nullable().optional(),
  priority: z.number().int().default(0),
  weight: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  experimentId: z.string().nullable().optional(),
  variant: z.string().nullable().optional(),
  abGroup: z.string().nullable().optional(),
});

const HeroUpdateSchema = HeroCreateSchema.partial().extend({
  id: z.string().min(1, "Hero id is required."),
});

function buildFieldErrors(error: z.ZodError) {
  const flattened = error.flatten();
  const fields: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages && messages.length > 0) {
      fields[key] = messages[0] as string;
    }
  }

  return { flattened, fields };
}

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

function handleError(error: unknown, label: string) {
  if (error instanceof HeroServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  console.error(label, error);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new HeroServiceError(400, {
      error: "Invalid JSON.",
    });
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.res;
  }

  try {
    const heroes = await getHeroList();
    return NextResponse.json({ heroes });
  } catch (error) {
    return handleError(error, "[ADMIN_HEROES_GET]");
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.res;
  }

  try {
    const parsed = HeroCreateSchema.safeParse(await parseJson(req));
    if (!parsed.success) {
      const { flattened, fields } = buildFieldErrors(parsed.error);
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: flattened,
          fields,
        },
        { status: 400 },
      );
    }

    if (parsed.data.type === "fallback") {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: {
            type: "Fallback heroes cannot be created from this endpoint.",
          },
        },
        { status: 400 },
      );
    }

    const hero = await createHero(parsed.data);
    return NextResponse.json({ hero }, { status: 201 });
  } catch (error) {
    return handleError(error, "[ADMIN_HEROES_POST]");
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.res;
  }

  try {
    const parsed = HeroUpdateSchema.safeParse(await parseJson(req));
    if (!parsed.success) {
      const { flattened, fields } = buildFieldErrors(parsed.error);
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: flattened,
          fields,
        },
        { status: 400 },
      );
    }

    const { id, ...input } = parsed.data;
    const hero = await updateHero(id, input);
    return NextResponse.json({ hero });
  } catch (error) {
    return handleError(error, "[ADMIN_HEROES_PUT]");
  }
}
