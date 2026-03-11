import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xenditClient } from "@/lib/xendit";

/**
 * POST /api/checkout/xendit
 *
 * Xendit one-time purchase flow (PromptPay / Thai local payments).
 * Mirrors /api/checkout but uses Xendit Invoice API instead of Stripe.
 *
 * Flow:
 *   1. Verify session (auth)
 *   2. Fetch resource — 404 if missing or free
 *   3. Guard against duplicate COMPLETED purchases
 *   4. Upsert a PENDING Purchase row (same @@unique([userId, resourceId]) constraint)
 *   5. Create a Xendit Invoice — use purchase.id as external_id
 *   6. Store xenditInvoiceId on the Purchase row
 *   7. Return { url: invoice.invoiceUrl } — client redirects there
 *
 * The webhook at /api/xendit/webhook completes the purchase when Xendit
 * calls back with status "PAID" or "SETTLED".
 *
 * IMPORTANT: Does NOT touch /api/checkout or /api/stripe/webhook.
 */
export async function POST(req: Request) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase." },
        { status: 401 },
      );
    }

    // ── 2. Parse body ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { resourceId } = body as { resourceId?: string };

    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json(
        { error: "resourceId is required." },
        { status: 400 },
      );
    }

    // ── 3. Fetch resource ──────────────────────────────────────────────────
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    if (resource.isFree || resource.price === 0) {
      return NextResponse.json(
        { error: "This resource is free — no checkout needed." },
        { status: 400 },
      );
    }

    // ── 4. Guard against duplicate COMPLETED purchases ─────────────────────
    const existingPurchase = await prisma.purchase.findFirst({
      where: { userId: session.user.id, resourceId },
    });

    if (existingPurchase?.status === "COMPLETED") {
      return NextResponse.json(
        { error: "You already own this resource." },
        { status: 409 },
      );
    }

    // ── 5. Fetch user email for Xendit invoice ─────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    // ── 6. Upsert PENDING Purchase row ─────────────────────────────────────
    // We create the row first so the webhook can always find a record to
    // update. The external_id we send to Xendit is the Purchase.id (cuid),
    // which is deterministic and lets the webhook skip metadata entirely.
    //
    // The @@unique([userId, resourceId]) constraint means a second checkout
    // attempt for the same user+resource will update the existing PENDING row
    // (new xenditInvoiceId) rather than creating a duplicate.
    const purchase = await prisma.purchase.upsert({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId,
        },
      },
      update: {
        status: "PENDING",
        paymentProvider: "XENDIT",
        // Clear any stale Xendit invoice ID so it gets overwritten below.
        xenditInvoiceId: null,
      },
      create: {
        userId: session.user.id,
        resourceId,
        amount: resource.price,
        currency: "thb",       // Xendit invoices in this route are Thai Baht
        status: "PENDING",
        paymentProvider: "XENDIT",
      },
    });

    // ── 7. Create Xendit Invoice ───────────────────────────────────────────
    // Amount: Xendit expects the full currency unit (e.g. 500 = 500 THB),
    // while our schema stores prices in the smallest unit (cents/satang).
    // Divide by 100 to convert.
    const invoice = await xenditClient.Invoice.createInvoice({
      data: {
        externalId: purchase.id,                // primary webhook match key
        amount: resource.price / 100,
        description: resource.title,
        currency: "THB",
        payerEmail: dbUser.email ?? undefined,
        successRedirectUrl: `${baseUrl}/resources?payment=success`,
        failureRedirectUrl: `${baseUrl}/resources/id/${resourceId}?payment=cancelled`,
        // Store userId and resourceId as metadata so the Xendit webhook has a
        // secondary fallback (mirrors the pattern used in the Stripe webhook).
        customer: {
          givenNames: dbUser.name ?? undefined,
          email: dbUser.email ?? undefined,
        },
        metadata: {
          userId: session.user.id,
          resourceId,
          purchaseId: purchase.id,
        },
      },
    });

    // ── 8. Store xenditInvoiceId on the Purchase row ───────────────────────
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { xenditInvoiceId: invoice.id },
    });

    console.log("[XENDIT CHECKOUT] Invoice created:", {
      purchaseId: purchase.id,
      invoiceId: invoice.id,
      amount: resource.price / 100,
      currency: "THB",
    });

    // ── 9. Return the Xendit Hosted Invoice URL ────────────────────────────
    return NextResponse.json({ data: { url: invoice.invoiceUrl } });
  } catch (err) {
    console.error("[XENDIT_CHECKOUT_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
