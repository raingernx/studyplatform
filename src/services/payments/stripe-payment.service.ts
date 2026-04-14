import Stripe from "stripe";
import { z } from "zod";
import { env } from "@/env";
import { logActivity } from "@/lib/activity";
import { routes } from "@/lib/routes";
import { stripe, SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/stripe";
import {
  findPurchaseByUserAndResource,
  setPurchaseStripeSessionId,
  upsertPendingPurchase,
} from "@/repositories/purchases/purchase.repository";
import { findResourceById, setResourceStripePriceId } from "@/repositories/resources/resource.repository";
import {
  findCheckoutUserById,
  updateUserStripeCustomerId,
} from "@/repositories/users/user.repository";
import { buildPurchaseSnapshot, PaymentServiceError } from "@/services/payments/payment.service";

const StripeCheckoutSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("payment"),
    resourceId: z.string().cuid(),
  }),
  z.object({
    mode: z.literal("subscription"),
    plan: z.enum(["pro_monthly", "pro_annual"]),
  }),
]);

async function ensureStripeCustomer(userId: string) {
  const user = await findCheckoutUserById(userId);

  if (!user) {
    throw new PaymentServiceError(404, { error: "User not found." });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await updateUserStripeCustomerId(user.id, customerId);
  }

  return { user, customerId };
}

// ── Stale-customer recovery ───────────────────────────────────────────────────

/**
 * Returns true when `err` is the Stripe "No such customer" error that occurs
 * after switching API keys (test ↔ live) or after a customer is deleted in
 * the Stripe dashboard.
 */
function isNoSuchCustomerError(err: unknown): boolean {
  return (
    err instanceof Stripe.errors.StripeInvalidRequestError &&
    err.code === "resource_missing" &&
    err.param === "customer"
  );
}

type CheckoutUser = NonNullable<Awaited<ReturnType<typeof findCheckoutUserById>>>;

/**
 * Creates a fresh Stripe customer for `user`, persists the new ID to the DB,
 * and returns it. Called only after we detect that the stored customer ID is
 * no longer valid in the current Stripe environment.
 */
async function recoverStripeCustomer(
  user: CheckoutUser,
): Promise<string> {
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });
  await updateUserStripeCustomerId(user.id, customer.id);
  return customer.id;
}

/**
 * Thin wrapper around `stripe.checkout.sessions.create` that transparently
 * recovers from a stale / missing Stripe customer ID.
 *
 * On first attempt: uses `customerId` as supplied.
 * On "No such customer" error: creates a new Stripe customer, persists the
 *   new ID, swaps it into `params`, and retries exactly once.
 * Any other error — or a second failure — propagates normally.
 */
async function createCheckoutSessionWithRecovery(
  params: Stripe.Checkout.SessionCreateParams,
  user: CheckoutUser,
): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.create(params);
  } catch (err) {
    if (!isNoSuchCustomerError(err)) throw err;

    const freshCustomerId = await recoverStripeCustomer(user);
    return stripe.checkout.sessions.create({
      ...params,
      customer: freshCustomerId,
    });
  }
}

export async function createLegacyStripeCheckout(body: unknown, userId: string) {
  const resourceId =
    typeof body === "object" && body !== null && "resourceId" in body
      ? (body as { resourceId?: string }).resourceId
      : undefined;

  if (!resourceId || typeof resourceId !== "string") {
    throw new PaymentServiceError(400, { error: "resourceId is required." });
  }

  const resource = await findResourceById(resourceId);

  if (!resource) {
    throw new PaymentServiceError(404, { error: "Resource not found." });
  }

  if (resource.isFree || resource.price === 0) {
    throw new PaymentServiceError(400, {
      error: "This resource is free — no checkout needed.",
    });
  }

  const existingPurchase = await findPurchaseByUserAndResource(userId, resourceId);

  if (existingPurchase?.status === "COMPLETED") {
    throw new PaymentServiceError(409, { error: "You already own this resource." });
  }

  const { user, customerId } = await ensureStripeCustomer(userId);

  const baseUrl = env.appBaseUrl;

  let priceId = resource.stripePriceId;
  if (!priceId) {
    const price = await stripe.prices.create({
      unit_amount: resource.price,
      currency: "usd",
      product_data: { name: resource.title },
    });
    priceId = price.id;
    await setResourceStripePriceId(resourceId, priceId);
  }

  const purchase = await upsertPendingPurchase({
    userId,
    resourceId,
    amount: resource.price,
    currency: "usd",
    paymentProvider: "STRIPE",
    ...buildPurchaseSnapshot(resource),
  });

  const checkoutSession = await createCheckoutSessionWithRecovery(
    {
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?slug=${encodeURIComponent(resource.slug)}`,
      cancel_url: `${baseUrl}/checkout/cancel?slug=${encodeURIComponent(resource.slug)}`,
      metadata: {
        purchaseId: purchase.id,
        userId,
        resourceId,
      },
      payment_intent_data: {
        metadata: {
          purchaseId: purchase.id,
          userId,
          resourceId,
        },
      },
    },
    user,
  );

  await setPurchaseStripeSessionId(purchase.id, checkoutSession.id);

  void logActivity({
    userId,
    action: "PURCHASE_CHECKOUT_STARTED",
    entity: "Resource",
    entityId: resourceId,
    metadata: {
      price: resource.price,
      currency: "usd",
    },
  }).catch((error) => {
    console.error("[STRIPE_CHECKOUT] Failed to log checkout start activity:", error);
  });

  return { data: { url: checkoutSession.url } };
}

export async function createStripeCheckout(body: unknown, userId: string) {
  const parsed = StripeCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    throw new PaymentServiceError(400, {
      error: parsed.error.errors[0].message,
    });
  }

  const { user, customerId } = await ensureStripeCustomer(userId);
  const baseUrl = env.appBaseUrl;

  if (parsed.data.mode === "payment") {
    const { resourceId } = parsed.data;
    const resource = await findResourceById(resourceId);

    if (!resource) {
      throw new PaymentServiceError(404, { error: "Resource not found." });
    }

    if (resource.isFree || resource.price === 0) {
      throw new PaymentServiceError(400, {
        error: "This resource is free — no checkout needed.",
      });
    }

    const existingPurchase = await findPurchaseByUserAndResource(user.id, resourceId);

    if (existingPurchase?.status === "COMPLETED") {
      throw new PaymentServiceError(409, { error: "You already own this resource." });
    }

    const purchase = await upsertPendingPurchase({
      userId: user.id,
      resourceId,
      amount: resource.price,
      currency: "thb",
      paymentProvider: "STRIPE",
      ...buildPurchaseSnapshot(resource),
    });

    const checkoutSession = await createCheckoutSessionWithRecovery(
      {
        customer: customerId,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "thb",
              unit_amount: resource.price,
              product_data: { name: resource.title },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/checkout/success?slug=${encodeURIComponent(resource.slug)}`,
        cancel_url: `${baseUrl}/checkout/cancel?slug=${encodeURIComponent(resource.slug)}`,
        metadata: {
          purchaseId: purchase.id,
          userId: user.id,
          resourceId,
        },
        payment_intent_data: {
          metadata: {
            purchaseId: purchase.id,
            userId: user.id,
            resourceId,
          },
        },
      },
      user,
    );

    await setPurchaseStripeSessionId(purchase.id, checkoutSession.id);

    return { data: { url: checkoutSession.url } };
  }

  const plan = parsed.data.plan as SubscriptionPlan;
  const priceId = SUBSCRIPTION_PLANS[plan];

  const checkoutSession = await createCheckoutSessionWithRecovery(
    {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}${routes.dashboardV2Membership}?subscription=success`,
      cancel_url: `${baseUrl}/pricing?subscription=cancelled`,
      subscription_data: { metadata: { userId: user.id, plan } },
    },
    user,
  );

  return { data: { url: checkoutSession.url } };
}
