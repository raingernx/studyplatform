import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { recordAnalyticsEvents } from "@/analytics/event.service";

const ImpressionSchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1).max(12),
  experiment: z.string().min(1),
  variant: z.string().min(1),
  section: z.string().min(1),
});

function isRecommendationImpressionTransientDbError(error: unknown) {
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

export async function POST(req: Request) {
  let body: unknown;
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.recommendationAnalytics, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests." },
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

  const parsed = ImpressionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  void recordAnalyticsEvents(
    parsed.data.resourceIds.map((resourceId, position) => ({
      eventType: "RESOURCE_VIEW" as const,
      userId: session?.user?.id ?? null,
      resourceId,
      metadata: {
        source: "recommendation_impression",
        experiment: parsed.data.experiment,
        variant: parsed.data.variant,
        section: parsed.data.section,
        position,
      },
    })),
  ).catch((error) => {
    if (isRecommendationImpressionTransientDbError(error)) {
      console.warn("[RECOMMENDATION_IMPRESSION_BEST_EFFORT]", {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
      });
      return;
    }

    console.error("[recommendation_impression]", error);
  });

  return NextResponse.json({ ok: true });
}
