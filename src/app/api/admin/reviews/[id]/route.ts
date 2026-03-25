import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { CACHE_TAGS, getResourceDetailDataTag } from "@/lib/cache";
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 },
      );
    }

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
      ? await unhideReview(session.user.id, id)
      : await hideReview(session.user.id, id);

    revalidateTag(CACHE_TAGS.discover, "max");
    revalidateTag(getResourceDetailDataTag(review.resourceId), "max");

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
