import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import {
  duplicateAdminResource,
  ResourceDuplicateServiceError,
} from "@/services/resources/mutations";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const duplicated = await duplicateAdminResource({
      resourceId: id,
      adminUserId: auth.session.user.id,
    });

    return NextResponse.json({ data: duplicated });
  } catch (err) {
    if (err instanceof ResourceDuplicateServiceError) {
      return NextResponse.json(err.payload, { status: err.status });
    }

    console.error("[ADMIN_RESOURCE_DUPLICATE]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
