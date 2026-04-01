import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ResourcesViewerScope } from "@/lib/resources/viewer-state";
import {
  getResourcesViewerBaseState,
  getResourcesViewerDiscoverState,
} from "@/services/resources/resources-viewer-state.service";

export const dynamic = "force-dynamic";

function getViewerScope(searchParams: URLSearchParams): ResourcesViewerScope {
  const scope = searchParams.get("scope");
  if (scope === "discover") {
    return "discover";
  }

  // Backward-compatible fallback for older callers still passing `mode=discover`.
  return searchParams.get("mode") === "discover" ? "discover" : "base";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const scope = getViewerScope(searchParams);
    const userId = session?.user?.id ?? null;
    const data =
      scope === "discover"
        ? await getResourcesViewerDiscoverState({ userId })
        : await getResourcesViewerBaseState({ userId });

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[RESOURCES_VIEWER_STATE_GET]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  }
}
