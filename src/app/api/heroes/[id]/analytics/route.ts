import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import {
  HeroServiceError,
  trackHeroClick,
  trackHeroImpression,
} from "@/services/heroes/hero.service";

const TrackHeroAnalyticsSchema = z.object({
  event: z.enum(["impression", "click"]),
});

type Params = {
  params: Promise<{ id: string }>;
};

function handleError(error: unknown) {
  if (error instanceof HeroServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  console.error("[HERO_ANALYTICS_POST]", error);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function POST(req: Request, { params }: Params) {
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

  const parsed = TrackHeroAnalyticsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed." },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const analytics =
      parsed.data.event === "impression"
        ? await trackHeroImpression(id)
        : await trackHeroClick(id);

    return NextResponse.json({
      success: true,
      impressions: analytics.impressions,
      clicks: analytics.clicks,
      ctr:
        analytics.impressions > 0
          ? Number(((analytics.clicks / analytics.impressions) * 100).toFixed(2))
          : 0,
    });
  } catch (error) {
    return handleError(error);
  }
}
