import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import {
  HeroServiceError,
  recordHeroImpressionEvent,
} from "@/services/heroes/hero.service";

const TrackHeroImpressionSchema = z.object({
  heroId: z.string().min(1, "Hero id is required."),
  experimentId: z.string().nullable().optional(),
  variant: z.string().nullable().optional(),
});

function isHeroImpressionTransientDbError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Timed out fetching a new connection from the connection pool") ||
    message.includes("Can't reach database server") ||
    message.includes("Error in PostgreSQL connection") ||
    message.includes("kind: Closed")
  );
}

function handleError(error: unknown) {
  if (error instanceof HeroServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  if (isHeroImpressionTransientDbError(error)) {
    console.warn("[HERO_IMPRESSION_BEST_EFFORT]", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json({ success: true });
  }

  console.error("[HERO_IMPRESSION_POST]", error);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.heroAnalytics, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many hero analytics requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = TrackHeroImpressionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 400 });
  }

  try {
    await recordHeroImpressionEvent(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
