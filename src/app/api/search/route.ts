import { NextResponse } from "next/server";
import { searchResources } from "@/services/search.service";

/**
 * GET /api/search?q=<query>[&category=<slug>][&limit=<n>]
 *
 * Public search endpoint — no authentication required.
 * Results are scoped to published, non-deleted resources.
 *
 * Query params:
 *   q        Required. Search query string (min 1 char after trim).
 *   category Optional. Category slug to restrict results.
 *   limit    Optional. Max results to return (default 20, max 50).
 *
 * Responses:
 *   200  { data: SearchResult[] }
 *   400  Missing or empty query
 *   500  Unexpected server error
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const query    = searchParams.get("q")        ?? "";
    const category = searchParams.get("category") ?? undefined;
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
    const limit    = isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 50);

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required." },
        { status: 400 }
      );
    }

    const results = await searchResources({ query, category, limit });

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("[SEARCH_GET]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
