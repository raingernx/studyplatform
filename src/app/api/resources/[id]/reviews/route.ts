import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { CACHE_TAGS, getResourceDetailDataTag } from "@/lib/cache";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { createReview, ReviewServiceError, updateReview } from "@/services/review.service";

type Params = {
  params: Promise<{ id: string }>;
};

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.reviewWrite, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many review requests. Please try again shortly." },
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

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid review payload." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const review = await createReview(session.user.id, id, parsed.data);

    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(getResourceDetailDataTag(id), "max");

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    console.error("[RESOURCE_REVIEW_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit this review." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.reviewWrite, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many review requests. Please try again shortly." },
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

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid review payload." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const review = await updateReview(session.user.id, id, parsed.data);

    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(getResourceDetailDataTag(id), "max");

    return NextResponse.json({ data: review });
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    console.error("[RESOURCE_REVIEW_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update this review." },
      { status: 500 },
    );
  }
}
