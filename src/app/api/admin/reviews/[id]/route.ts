import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import {
  CACHE_TAGS,
  deleteResourceReviewRedisKeys,
  deleteResourceTrustRedisKeys,
  getResourceDetailDataTag,
} from "@/lib/cache";
import {
  hideReview,
  ReviewServiceError,
  unhideReview,
} from "@/services/review.service";

type Params = {
  params: Promise<{ id: string }>;
};

const ReviewVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const parsed = ReviewVisibilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid moderation payload." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const review = parsed.data.isVisible
      ? await unhideReview(auth.session.user.id, id)
      : await hideReview(auth.session.user.id, id);

    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(getResourceDetailDataTag(review.resourceId), "max");
    await Promise.all([
      deleteResourceTrustRedisKeys(review.resourceId),
      deleteResourceReviewRedisKeys(review.resourceId),
    ]);

    return NextResponse.json({ data: review });
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }

    console.error("[ADMIN_REVIEW_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update review visibility." },
      { status: 500 },
    );
  }
}
