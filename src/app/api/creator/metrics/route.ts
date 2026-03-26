import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreatorMetrics } from "@/services/creator.service";

/**
 * Deprecated creator metrics route kept temporarily because generated App
 * Router types in this repo still reference this file. There are no current
 * repo-local callers; creator dashboards read metrics server-side.
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
