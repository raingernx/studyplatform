import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreatorSlugAvailability } from "@/services/creator";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const result = await getCreatorSlugAvailability(session.user.id, slug);

  return NextResponse.json(result);
}
