import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteResourceRoute,
  getResourceRouteData,
  ResourceRouteServiceError,
  updateResourceRoute,
} from "@/services/resources/mutations";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/resources/[id] ────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const resource = await getResourceRouteData(id);

    return NextResponse.json({ data: resource });
  } catch (err) {
    if (err instanceof ResourceRouteServiceError) {
      return NextResponse.json(err.payload, { status: err.status });
    }

    console.error("[RESOURCE_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const updated = await updateResourceRoute({
      resourceId: id,
      actorId: session.user.id,
      actorRole: session.user.role,
      loadBody: () => req.json(),
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof ResourceRouteServiceError) {
      return NextResponse.json(err.payload, { status: err.status });
    }

    console.error("[RESOURCE_PATCH]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ── DELETE /api/resources/[id] ──────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const deleted = await deleteResourceRoute({
      resourceId: id,
      actorRole: session.user.role,
    });

    return NextResponse.json({ data: deleted });
  } catch (err) {
    if (err instanceof ResourceRouteServiceError) {
      return NextResponse.json(err.payload, { status: err.status });
    }

    console.error("[RESOURCE_DELETE]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
