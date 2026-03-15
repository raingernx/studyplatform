import { NextResponse } from "next/server";
import { z } from "zod";
import {
  HeroServiceError,
  recordHeroImpressionEvent,
} from "@/services/heroes/hero.service";

const TrackHeroImpressionSchema = z.object({
  heroId: z.string().min(1, "Hero id is required."),
  experimentId: z.string().nullable().optional(),
  variant: z.string().nullable().optional(),
});

function handleError(error: unknown) {
  if (error instanceof HeroServiceError) {
    return NextResponse.json(error.payload, { status: error.status });
  }

  console.error("[HERO_IMPRESSION_POST]", error);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
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
