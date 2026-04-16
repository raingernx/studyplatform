import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCreatorAccessCacheTag } from "@/lib/cache";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import {
  CreatorServiceError,
  approveCreatorApplication,
  rejectCreatorApplication,
} from "@/services/creator";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    let body: { action?: unknown; reason?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const { action, reason } = body;
    const { userId } = await params;

    if (action === "approve") {
      await approveCreatorApplication(userId);
      revalidateTag(getCreatorAccessCacheTag(userId), "max");
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
      }
      await rejectCreatorApplication(userId, reason.trim());
      revalidateTag(getCreatorAccessCacheTag(userId), "max");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
  } catch (error) {
    if (error instanceof CreatorServiceError) {
      return NextResponse.json(error.payload, { status: error.status });
    }
    console.error("[ADMIN_CREATORS_PATCH]", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
