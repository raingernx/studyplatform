import { NextResponse } from "next/server";
import { getSearchRecoveryData } from "@/services/search-recovery.service";

const SEARCH_RECOVERY_RESPONSE_HEADERS = {
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
} as const;

/**
 * GET /api/search/recovery?q=<query>
 *
 * Public no-results recovery endpoint for typeahead/dropdown flows.
 * Returns alternate queries plus related taxonomy matches without running the
 * ranked search query again.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required." },
        { status: 400 },
      );
    }

    const recovery = await getSearchRecoveryData(query);

    return NextResponse.json(
      {
        data: recovery,
      },
      {
        headers: SEARCH_RECOVERY_RESPONSE_HEADERS,
      },
    );
  } catch (error) {
    console.error("[SEARCH_RECOVERY_GET]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
