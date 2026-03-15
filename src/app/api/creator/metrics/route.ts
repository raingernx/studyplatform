import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreatorMetrics } from "@/services/creator.service";

/**
 * GET /api/creator/metrics
 *
 * Returns the creator metrics for the currently authenticated user.
 * Any signed-in user can access their own creator metrics.
 *
 * Responses:
 *   200  CreatorMetrics object
 *   401  Not authenticated
 *   500  Unexpected server error
 */
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const metrics = await getCreatorMetrics(session.user.id);

    return NextResponse.json({ data: metrics });
  } catch (err) {
    console.error("[CREATOR_METRICS_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
