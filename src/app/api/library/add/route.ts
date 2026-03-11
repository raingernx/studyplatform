import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AddToLibrarySchema = z.object({
  resourceId: z.string().cuid(),
});

/**
 * POST /api/library/add
 *
 * Adds a FREE resource to the authenticated user's library by creating
 * a Purchase record with status = COMPLETED and paymentProvider = "FREE".
 *
 * The operation is idempotent: calling it a second time for the same
 * user + resource will simply return { success: true } without creating
 * a duplicate (enforced by the @@unique([userId, resourceId]) constraint).
 *
 * Request body:
 *   { resourceId: string }
 *
 * Responses:
 *   200  { success: true }
 *   400  Validation error, or resource is not free
 *   401  Not authenticated
 *   404  Resource not found / not published
 *   500  Unexpected server error
 */
export async function POST(req: Request) {
  try {
    // ── 1. Require authentication ─────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to add resources to your library." },
        { status: 401 }
      );
    }

    // ── 2. Parse and validate request body ────────────────────────────────
    const body = await req.json();
    const parsed = AddToLibrarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { resourceId } = parsed.data;
    const userId = session.user.id;

    // ── 3. Verify resource exists, is published, and is actually free ──────
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, isFree: true, status: true },
    });

    if (!resource || resource.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    if (!resource.isFree) {
      return NextResponse.json(
        { error: "This resource requires payment. Please use the checkout flow." },
        { status: 400 }
      );
    }

    // ── 4. Upsert purchase record (idempotent) ────────────────────────────
    //
    // The @@unique([userId, resourceId]) constraint means there is at most
    // one row per pair. Using upsert avoids a race condition between the
    // existence check and the insert.
    await prisma.purchase.upsert({
      where: { userId_resourceId: { userId, resourceId } },
      update: {
        // Bring any pre-existing PENDING/FAILED row up to COMPLETED.
        status: "COMPLETED",
        paymentProvider: "FREE",
      },
      create: {
        userId,
        resourceId,
        amount: 0,
        currency: "usd",
        status: "COMPLETED",
        paymentProvider: "FREE",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[LIBRARY_ADD]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
