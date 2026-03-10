import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyXenditWebhook } from "@/lib/xendit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/xendit/webhook
//
// Receives Xendit invoice callbacks and transitions Purchase status
// PENDING → COMPLETED, mirroring the Stripe webhook at /api/stripe/webhook.
//
// Xendit webhook security model:
//   Xendit signs every callback with a static token you set in the dashboard
//   (Settings → Callbacks → Callback token). The token is sent in the
//   x-callback-token header. We compare it to XENDIT_WEBHOOK_TOKEN in .env.
//
// This handler is idempotent: calling it twice for the same invoice has no
// effect because we guard with status: { not: "COMPLETED" }.
//
// Three-level matching strategy (mirrors Stripe webhook pattern):
//   L1 — xenditInvoiceId          (primary, always set in /api/checkout/xendit)
//   L2 — external_id → purchaseId (fallback if xenditInvoiceId row is missing)
//   L3 — metadata.userId + metadata.resourceId (last resort)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[XENDIT WEBHOOK] Incoming request");

  // ── 1. Verify callback token ───────────────────────────────────────────────
  const callbackToken = headers().get("x-callback-token");

  if (!verifyXenditWebhook(callbackToken)) {
    console.error("[XENDIT WEBHOOK] Invalid or missing callback token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let payload: XenditInvoicePayload;
  try {
    payload = await req.json();
  } catch {
    console.error("[XENDIT WEBHOOK] Failed to parse JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[XENDIT WEBHOOK] Event:", {
    id: payload.id,
    external_id: payload.external_id,
    status: payload.status,
    amount: payload.paid_amount ?? payload.amount,
    currency: payload.currency,
  });

  // ── 3. Only process completed payments ────────────────────────────────────
  // Xendit uses "PAID" for one-time invoices and "SETTLED" in some API
  // versions / payment methods. Accept both.
  const isPaid = payload.status === "PAID" || payload.status === "SETTLED";

  if (!isPaid) {
    console.log(
      "[XENDIT WEBHOOK] Status is not PAID/SETTLED — ignoring:",
      payload.status,
    );
    // Return 200 so Xendit does not retry non-terminal statuses.
    return NextResponse.json({ received: true });
  }

  try {
    await handleXenditPayment(payload);
    console.log("[XENDIT WEBHOOK] ✔ Handler finished");
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[XENDIT WEBHOOK] ❌ Handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// handleXenditPayment
// ---------------------------------------------------------------------------
async function handleXenditPayment(payload: XenditInvoicePayload) {
  const invoiceId = payload.id;
  const externalId = payload.external_id; // = purchase.id from /api/checkout/xendit
  const userId = payload.metadata?.userId ?? null;
  const resourceId = payload.metadata?.resourceId ?? null;
  const purchaseId = payload.metadata?.purchaseId ?? null;

  console.log("[XENDIT WEBHOOK] Resolving purchase:", {
    invoiceId,
    externalId,
    userId,
    resourceId,
    purchaseId,
  });

  // ── L1: Match by xenditInvoiceId ──────────────────────────────────────────
  let updated = await prisma.purchase.updateMany({
    where: {
      xenditInvoiceId: invoiceId,
      status: { not: "COMPLETED" },
    },
    data: {
      status: "COMPLETED",
    },
  });

  console.log(
    "[XENDIT WEBHOOK] L1 (xenditInvoiceId) rows updated:",
    updated.count,
  );

  // ── L2: Match by purchase.id stored as external_id ───────────────────────
  // /api/checkout/xendit uses purchase.id as external_id, so this is a
  // deterministic fallback that does not rely on metadata at all.
  if (updated.count === 0 && externalId) {
    updated = await prisma.purchase.updateMany({
      where: {
        id: externalId,
        status: { not: "COMPLETED" },
      },
      data: {
        status: "COMPLETED",
        xenditInvoiceId: invoiceId, // backfill if it was missing
      },
    });

    console.log(
      "[XENDIT WEBHOOK] L2 (external_id) rows updated:",
      updated.count,
    );
  }

  // ── L3: Match by userId + resourceId from metadata ────────────────────────
  if (updated.count === 0) {
    console.warn(
      "[XENDIT WEBHOOK] L1+L2 matched 0 rows — attempting metadata recovery.",
    );

    // Resolve purchaseId from externalId if metadata didn't carry it.
    const resolvedUserId = userId;
    const resolvedResourceId = resourceId ?? null;

    if (!resolvedUserId || !resolvedResourceId) {
      console.error(
        "[XENDIT WEBHOOK] Recovery failed — missing userId/resourceId.",
        { invoiceId, externalId, metadata: payload.metadata },
      );
      // Dead-letter: store unresolvable event for later reconciliation.
      prisma.webhookEvent
        .create({
          data: {
            provider: "XENDIT",
            eventType: "invoice.paid",
            payload: payload as unknown as Record<string, unknown>,
          },
        })
        .catch((err) =>
          console.warn(
            "[XENDIT WEBHOOK] Failed to store dead-letter event:",
            err,
          ),
        );
      // Return without error — Xendit would keep retrying on 5xx but this
      // event is unresolvable; returning 200 silences future retries.
      return;
    }

    // Idempotency guard.
    const existingByUser = await prisma.purchase.findFirst({
      where: { userId: resolvedUserId, resourceId: resolvedResourceId },
    });

    if (existingByUser?.status === "COMPLETED") {
      console.log("[XENDIT WEBHOOK] Recovery skipped — already COMPLETED.");
      return;
    }

    await prisma.purchase.upsert({
      where: {
        userId_resourceId: {
          userId: resolvedUserId,
          resourceId: resolvedResourceId,
        },
      },
      update: {
        status: "COMPLETED",
        paymentProvider: "XENDIT",
        xenditInvoiceId: invoiceId,
      },
      create: {
        userId: resolvedUserId,
        resourceId: resolvedResourceId,
        amount: payload.paid_amount ?? payload.amount ?? 0,
        currency: (payload.currency ?? "thb").toLowerCase(),
        status: "COMPLETED",
        paymentProvider: "XENDIT",
        xenditInvoiceId: invoiceId,
      },
    });

    console.log("[XENDIT WEBHOOK] Recovery completed for:", {
      userId: resolvedUserId,
      resourceId: resolvedResourceId,
    });

    // Increment download count only on this delivery's transition.
    if (resolvedResourceId) {
      await incrementDownloadCount(resolvedResourceId);
    }

    return;
  }

  // ── Primary path: increment download count ────────────────────────────────
  // updated.count > 0 means this specific delivery performed the transition.
  // Resolve resourceId from the purchase row we just updated.
  const resolvedResourceId =
    resourceId ??
    (await prisma.purchase
      .findFirst({
        where: { xenditInvoiceId: invoiceId },
        select: { resourceId: true },
      })
      .then((r) => r?.resourceId ?? null));

  if (resolvedResourceId) {
    console.log(
      "[XENDIT WEBHOOK] Incrementing downloadCount for:",
      resolvedResourceId,
    );
    await incrementDownloadCount(resolvedResourceId);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function incrementDownloadCount(resourceId: string) {
  await prisma.resource
    .update({
      where: { id: resourceId },
      data: { downloadCount: { increment: 1 } },
    })
    .catch((err) =>
      console.warn(
        "[XENDIT WEBHOOK] downloadCount update failed:",
        err?.code ?? err,
      ),
    );
}

// ---------------------------------------------------------------------------
// Xendit Invoice Webhook Payload type
// Xendit sends snake_case keys in webhook callbacks.
// ---------------------------------------------------------------------------
interface XenditInvoicePayload {
  id: string;
  external_id: string;
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  amount: number;
  paid_amount?: number;
  currency?: string;
  metadata?: {
    userId?: string;
    resourceId?: string;
    purchaseId?: string;
    [key: string]: string | undefined;
  };
}
