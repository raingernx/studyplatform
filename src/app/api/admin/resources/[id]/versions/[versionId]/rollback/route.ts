import { NextResponse } from "next/server";
import { after } from "next/server";

import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { warmTargetedPublicCaches } from "@/services/performance/public-cache-warm.service";
import {
  rollbackResourceVersion,
  ResourceVersionRollbackServiceError,
} from "@/services/resources/mutations";

type Params = { params: Promise<{ id: string; versionId: string }> };

// POST /api/admin/resources/:id/versions/:versionId/rollback
export async function POST(_req: Request, { params }: Params) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.res;

    const { id: resourceId, versionId } = await params;

    const rolledBack = await rollbackResourceVersion({
      resourceId,
      versionId,
      adminUserId: auth.session.user.id,
    });
    after(() => {
      void warmTargetedPublicCaches({
        trigger: "admin_resource_version_rollback",
        includeTrustSummaries: false,
        resourceIds: [resourceId],
      }).catch((error) => {
        console.error("[ADMIN_RESOURCE_VERSION_ROLLBACK_WARM]", error);
      });
    });

    return NextResponse.json({
      data: rolledBack,
    });
  } catch (err) {
    if (err instanceof ResourceVersionRollbackServiceError) {
      return NextResponse.json(err.payload, { status: err.status });
    }

    console.error("[ADMIN_RESOURCE_VERSION_ROLLBACK_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
