import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Safely extracts a bare string ID from a Stripe expandable field.
// Stripe returns these as either a plain string, an expanded object, or null.
// Casting directly with `as string` is unsafe and can produce "[object Object]"
// which violates the @unique constraint on stripePaymentIntentId.
// ---------------------------------------------------------------------------
function extractId(
  field: string | { id: string } | null | undefined,
): string | null {
  if (!field) return null;
  if (typeof field === "string") return field;
  return field.id ?? null;
}

// ---------------------------------------------------------------------------
// Increment a resource's downloadCount.
// Wrapped in .catch() so a missing resource never blocks a status update.
// ---------------------------------------------------------------------------
async function incrementDownloadCount(resourceId: string) {
  await prisma.resource
    .update({
      where: { id: resourceId },
      data: { downloadCount: { increment: 1 } },
    })
    .catch((err) =>
      console.warn("[WEBHOOK] downloadCount update failed:", err?.code ?? err),
    );
}

// ---------------------------------------------------------------------------
// POST /api/stripe/webhook
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[WEBHOOK] Incoming request");
  console.log("🔥 WEBHOOK HIT", new Date().toISOString());

  // ── 1. Read raw body (must be raw — Next.js App Router does not pre-parse) ─
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    console.error("[WEBHOOK] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // ── 2. Verify Stripe signature ────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[WEBHOOK] Event type :", event.type);
  console.log("[WEBHOOK] Event ID   :", event.id);

  // ── 3. Dispatch ────────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("──────── SESSION DATA ────────────────────────────────");
        console.log("  session.id      :", session.id);
        console.log("  session.mode    :", session.mode);
        console.log("  payment_status  :", session.payment_status);
        console.log("  payment_intent  :", session.payment_intent);
        console.log("  metadata        :", session.metadata);

        if (session.mode === "payment") {
          await handlePayment(session);
        } else if (session.mode === "subscription") {
          await handleSubscription(session);
        }
        break;
      }

      default:
        console.log("[WEBHOOK] Unhandled event type:", event.type);
    }

    console.log("[WEBHOOK] ✔ Handler finished successfully");
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[WEBHOOK] ❌ Unhandled handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// handlePayment
//
// Three-level matching strategy — each level is a fallback for the one above.
//
//  L1 — stripeSessionId
//       The cleanest match. /api/checkout always writes stripeSessionId before
//       redirecting, so for the normal flow this always resolves.
//
//  L2 — stripePaymentIntentId
//       Fires when the user opened checkout twice: the second /api/checkout call
//       overwrote stripeSessionId in the DB with the newer session, but the user
//       paid on the first session. We match by payment_intent instead.
//
//  L3 — userId + resourceId from metadata (with PI API fallback)
//       Last resort. Handles metadata-empty scenarios (e.g. stripe trigger in
//       dev, or rare Stripe API edge cases). Falls back to calling
//       stripe.paymentIntents.retrieve() which reads the metadata we stored via
//       payment_intent_data.metadata in /api/checkout.
// ---------------------------------------------------------------------------
async function handlePayment(session: Stripe.Checkout.Session) {
  const sessionId       = session.id;
  const paymentIntentId = extractId(session.payment_intent);

  // Metadata is set both on the session and on the PaymentIntent (via
  // payment_intent_data.metadata in /api/checkout).
  let userId     = session.metadata?.userId     ?? null;
  let resourceId = session.metadata?.resourceId ?? null;

  console.log("━━━━━━━━ PAYMENT HANDLER ━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  sessionId       :", sessionId);
  console.log("  paymentIntentId :", paymentIntentId);
  console.log("  payment_status  :", session.payment_status);
  console.log("  metadata        :", { userId, resourceId });

  // Guard: only process sessions where payment is actually confirmed.
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    console.warn("[WEBHOOK] payment_status is not paid — skipping.");
    return;
  }

  // ── L1: Match by stripeSessionId ─────────────────────────────────────────
  // Status update is intentionally separate from the paymentIntentId update.
  // Combining them risks a P2002 unique constraint violation on
  // stripePaymentIntentId blocking the status change entirely.
  let updated = await prisma.purchase.updateMany({
    where: {
      stripeSessionId: sessionId,
      status: { not: "COMPLETED" },
    },
    data: { status: "COMPLETED" },
  });

  console.log("[WEBHOOK] L1 (stripeSessionId) rows updated:", updated.count);

  // ── L2: Match by stripePaymentIntentId ───────────────────────────────────
  if (updated.count === 0 && paymentIntentId) {
    updated = await prisma.purchase.updateMany({
      where: {
        stripePaymentIntentId: paymentIntentId,
        status: { not: "COMPLETED" },
      },
      data: { status: "COMPLETED" },
    });

    console.log("[WEBHOOK] L2 (paymentIntentId) rows updated:", updated.count);
  }

  // ── Write paymentIntentId (isolated from status update) ──────────────────
  // Runs whenever L1 or L2 succeeded. Kept in its own .catch() so a P2002
  // on this unique field can never roll back the status transition above.
  if (updated.count > 0 && paymentIntentId) {
    await prisma.purchase
      .updateMany({
        where: { stripeSessionId: sessionId },
        data: { stripePaymentIntentId: paymentIntentId },
      })
      .catch((err) =>
        console.warn(
          "[WEBHOOK] Could not write stripePaymentIntentId:",
          err?.code,
          paymentIntentId,
        ),
      );
  }

  // ── L3: Metadata recovery ─────────────────────────────────────────────────
  if (updated.count === 0) {
    console.warn(
      "[WEBHOOK] L1+L2 both matched 0 rows — attempting metadata recovery.",
    );

    // If session.metadata is empty (e.g. stripe trigger), retrieve the
    // PaymentIntent directly. /api/checkout mirrors metadata onto the PI via
    // payment_intent_data.metadata, so this is always a reliable fallback.
    if ((!userId || !resourceId) && paymentIntentId) {
      console.log(
        "[WEBHOOK] session.metadata empty — fetching from PaymentIntent:",
        paymentIntentId,
      );
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        userId     = userId     ?? pi.metadata?.userId     ?? null;
        resourceId = resourceId ?? pi.metadata?.resourceId ?? null;
        console.log("[WEBHOOK] PaymentIntent metadata:", pi.metadata);
      } catch (err) {
        console.warn("[WEBHOOK] Could not retrieve PaymentIntent:", err);
      }
    }

    if (!userId || !resourceId) {
      console.error(
        "[WEBHOOK] Recovery failed — missing userId or resourceId after all fallbacks.",
        { sessionId, paymentIntentId, sessionMetadata: session.metadata },
      );
      // Dead-letter: store unresolvable event for later reconciliation.
      prisma.webhookEvent
        .create({
          data: {
            provider: "STRIPE",
            eventType: "checkout.session.completed",
            payload: JSON.parse(JSON.stringify(session)),
          },
        })
        .catch((err) =>
          console.warn("[WEBHOOK] Failed to store dead-letter event:", err),
        );
      // Return without error so Stripe does not retry an unresolvable event.
      return;
    }

    // Idempotency guard: if the row is already COMPLETED, nothing to do.
    const existingByUser = await prisma.purchase.findFirst({
      where: { userId, resourceId },
    });

    if (existingByUser?.status === "COMPLETED") {
      console.log("[WEBHOOK] Recovery skipped — row already COMPLETED.");
      return;
    }

    // Upsert status + sessionId. PI ID written in a separate isolated call.
    await prisma.purchase.upsert({
      where: { userId_resourceId: { userId, resourceId } },
      update: {
        status: "COMPLETED",
        stripeSessionId: sessionId,
      },
      create: {
        userId,
        resourceId,
        amount: session.amount_total ?? 0,
        status: "COMPLETED",
        stripeSessionId: sessionId,
      },
    });

    if (paymentIntentId) {
      await prisma.purchase
        .updateMany({
          where: { stripeSessionId: sessionId },
          data: { stripePaymentIntentId: paymentIntentId },
        })
        .catch((err) =>
          console.warn(
            "[WEBHOOK] Recovery: could not write stripePaymentIntentId:",
            err?.code,
          ),
        );
    }

    console.log("[WEBHOOK] Recovery completed for:", { userId, resourceId });

    // Only increment download count when THIS delivery caused the transition.
    await incrementDownloadCount(resourceId);
    return;
  }

  // ── Primary path download count ──────────────────────────────────────────
  // Runs only when updated.count > 0, i.e. this specific delivery performed
  // the PENDING → COMPLETED transition. Webhook retries that arrive after the
  // row is already COMPLETED will hit updated.count === 0 on L1, attempt L2
  // (also 0 since PI ID won't match COMPLETED filter), then hit L3 where the
  // COMPLETED idempotency guard returns early — so this block never double-fires.
  if (resourceId) {
    console.log("[WEBHOOK] Incrementing downloadCount for:", resourceId);
    await incrementDownloadCount(resourceId);
  }
}

// ---------------------------------------------------------------------------
// handleSubscription
// ---------------------------------------------------------------------------
async function handleSubscription(session: Stripe.Checkout.Session) {
  console.log("━━━━━━━━ SUBSCRIPTION HANDLER ━━━━━━━━━━━━━━━━━");

  const subscriptionId = extractId(session.subscription);

  if (!subscriptionId) {
    console.warn("[WEBHOOK] Missing subscription ID — skipping.");
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const userId = sub.metadata?.userId;
  const plan   = sub.metadata?.plan;

  console.log("[WEBHOOK] Subscription metadata:", sub.metadata);

  if (!userId) {
    console.warn("[WEBHOOK] No userId on subscription metadata — skipping.");
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus:   "ACTIVE",
      subscriptionPlan:     plan ?? null,
      currentPeriodEnd:     new Date(sub.current_period_end * 1000),
    },
  });

  console.log("[WEBHOOK] Subscription activated for:", userId);
}
