import Stripe from "stripe";
import { recordPurchaseAnalytics } from "@/analytics/event.service";
import { stripe } from "@/lib/stripe";
import {
  completeRecoveredPurchase,
  completeStripePurchaseByPaymentIntent,
  completeStripePurchaseBySession,
  createWebhookDeadLetterEvent,
  findPurchaseAnalyticsContextByStripePaymentIntentId,
  findPurchaseAnalyticsContextByStripeSessionId,
  findPurchaseAnalyticsContextByUserAndResource,
  findPurchaseByUserAndResource,
  setPurchaseStripePaymentIntentIdBySession,
} from "@/repositories/purchases/purchase.repository";
import { findResourceById } from "@/repositories/resources/resource.repository";
import { activateUserStripeSubscription } from "@/repositories/users/user.repository";
import { buildPurchaseSnapshot, PaymentServiceError } from "@/services/payments/payment.service";

function extractId(
  field: string | { id: string } | null | undefined,
): string | null {
  if (!field) return null;
  if (typeof field === "string") return field;
  return field.id ?? null;
}

export function constructStripeWebhookEvent(
  body: string,
  signature: string,
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("[WEBHOOK] Signature verification failed:", error);
    throw new PaymentServiceError(400, { error: "Invalid signature" });
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment") {
        await handleStripePayment(session);
      } else if (session.mode === "subscription") {
        await handleStripeSubscription(session);
      }
      return;
    }

    default:
      console.log("[WEBHOOK] Unhandled event type:", event.type);
  }
}

async function handleStripePayment(session: Stripe.Checkout.Session) {
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    console.warn("[WEBHOOK] payment_status is not paid - skipping.");
    return;
  }

  const sessionId = session.id;
  const paymentIntentId = extractId(session.payment_intent);

  let userId = session.metadata?.userId ?? null;
  let resourceId = session.metadata?.resourceId ?? null;

  let completion = await completeStripePurchaseBySession(sessionId);

  if (completion.completed && paymentIntentId) {
    await setPurchaseStripePaymentIntentIdBySession(
      sessionId,
      paymentIntentId,
    ).catch((error) =>
      console.warn(
        "[WEBHOOK] Could not write stripePaymentIntentId:",
        error?.code,
        paymentIntentId,
      ),
    );
  }

  if (completion.completed) {
    await recordStripePurchaseAnalytics({
      sessionId,
      paymentIntentId,
    });
  }

  if (!completion.matched && paymentIntentId) {
    completion = await completeStripePurchaseByPaymentIntent(paymentIntentId);
  }

  if (completion.completed) {
    await recordStripePurchaseAnalytics({
      sessionId,
      paymentIntentId,
    });
  }

  if (completion.matched) {
    return;
  }

  if ((!userId || !resourceId) && paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      userId = userId ?? paymentIntent.metadata?.userId ?? null;
      resourceId = resourceId ?? paymentIntent.metadata?.resourceId ?? null;
    } catch (error) {
      console.warn("[WEBHOOK] Could not retrieve PaymentIntent:", error);
    }
  }

  if (!userId || !resourceId) {
    console.error(
      "[WEBHOOK] Recovery failed - missing userId or resourceId after all fallbacks.",
      { sessionId, paymentIntentId, sessionMetadata: session.metadata },
    );

    await createWebhookDeadLetterEvent(
      "STRIPE",
      "checkout.session.completed",
      session,
    ).catch((error) =>
      console.warn("[WEBHOOK] Failed to store dead-letter event:", error),
    );

    return;
  }

  const existingPurchase = await findPurchaseByUserAndResource(userId, resourceId);

  if (existingPurchase?.status === "COMPLETED") {
    return;
  }

  const resource = await findResourceById(resourceId);
  if (!resource) {
    console.error("[WEBHOOK] Recovery failed - resource not found.", {
      sessionId,
      paymentIntentId,
      resourceId,
    });
    return;
  }

  const recovered = await completeRecoveredPurchase({
    userId,
    resourceId,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    paymentProvider: "STRIPE",
    ...buildPurchaseSnapshot(resource, session.amount_total ?? resource.price),
    stripeSessionId: sessionId,
  });

  if (paymentIntentId) {
    await setPurchaseStripePaymentIntentIdBySession(
      sessionId,
      paymentIntentId,
    ).catch((error) =>
      console.warn(
        "[WEBHOOK] Recovery: could not write stripePaymentIntentId:",
        error?.code,
      ),
    );
  }

  if (recovered.completed) {
    await recordStripePurchaseAnalytics({
      sessionId,
      paymentIntentId,
      userId,
      resourceId,
    });
  }
}

async function handleStripeSubscription(session: Stripe.Checkout.Session) {
  const subscriptionId = extractId(session.subscription);

  if (!subscriptionId) {
    console.warn("[WEBHOOK] Missing subscription ID - skipping.");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.warn("[WEBHOOK] No userId on subscription metadata - skipping.");
    return;
  }

  await activateUserStripeSubscription({
    userId,
    stripeSubscriptionId: subscription.id,
    subscriptionPlan: subscription.metadata?.plan ?? null,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

interface StripePurchaseAnalyticsInput {
  sessionId: string;
  paymentIntentId: string | null;
  userId?: string | null;
  resourceId?: string | null;
}

async function recordStripePurchaseAnalytics(
  input: StripePurchaseAnalyticsInput,
) {
  const context =
    (await findPurchaseAnalyticsContextByStripeSessionId(input.sessionId)) ??
    (input.paymentIntentId
      ? await findPurchaseAnalyticsContextByStripePaymentIntentId(
          input.paymentIntentId,
        )
      : null) ??
    (input.userId && input.resourceId
      ? await findPurchaseAnalyticsContextByUserAndResource(
          input.userId,
          input.resourceId,
        )
      : null);

  if (!context) {
    return;
  }

  await recordPurchaseAnalytics({
    purchaseId: context.purchaseId,
    userId: context.userId,
    resourceId: context.resourceId,
    creatorId: context.creatorId,
    amount: context.amount,
    paymentProvider: "STRIPE",
  }).catch((error) => {
    console.error("[WEBHOOK] Failed to record Stripe purchase analytics:", error);
  });
}
