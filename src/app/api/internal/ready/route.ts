import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      data: {
        status: "ok",
        service: "studyplatform",
        runtime: process.env.NODE_ENV ?? "unknown",
        timestamp: new Date().toISOString(),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
