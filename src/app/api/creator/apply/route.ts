import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreatorAccessCacheTag } from "@/lib/cache";
import { CreatorServiceError, submitCreatorApplication } from "@/services/creator";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { success, limit, remaining, reset } = await checkRateLimit(LIMITS.creatorApply, getClientIp(req));
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit":     String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset":     String(reset),
            "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    await submitCreatorApplication(session.user.id, body);
    revalidateTag(getCreatorAccessCacheTag(session.user.id), "max");

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CreatorServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }
    console.error("[CREATOR_APPLY_POST]", error);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
