import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createAdminResourceDraft,
  ResourceServiceError,
} from "@/services/resources/resource.service";

function handleServiceError(err: unknown, label: string) {
  if (err instanceof ResourceServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error(label, err);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

// ── POST /api/admin/resources/draft ─────────────────────────────────────────────

/**
 * Create an empty draft resource so that uploads can be attached immediately.
 *
 * Responses:
 *   201  Draft created successfully
 *   401  Not authenticated
 *   403  Not an ADMIN
 */
export async function POST(_req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const resource = await createAdminResourceDraft(session.user.id);

    return NextResponse.json({ id: resource.id }, { status: 201 });
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_DRAFT_POST]");
  }
}
