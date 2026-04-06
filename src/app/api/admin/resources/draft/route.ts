import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
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
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const resource = await createAdminResourceDraft(auth.session.user.id);

    return NextResponse.json({ id: resource.id }, { status: 201 });
  } catch (err) {
    return handleServiceError(err, "[ADMIN_RESOURCES_DRAFT_POST]");
  }
}
