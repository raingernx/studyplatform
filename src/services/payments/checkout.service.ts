/**
 * Checkout Service
 *
 * Single entry point for all checkout flows — free claims and paid sessions.
 * Delegates to the appropriate provider service; callers never need to know
 * which provider is involved.
 *
 * Architecture: API routes call this service. This service calls
 * provider-specific services (stripe-payment, xendit-payment) or the
 * library service for free resources. No Prisma calls here.
 */

import { z } from "zod";
import {
  addFreeResourceToLibrary,
  LibraryServiceError,
} from "@/services/purchases/library.service";
import { PaymentServiceError } from "@/services/payments/payment.service";
import { createStripeCheckout } from "@/services/payments/stripe-payment.service";
import { createXenditCheckout } from "@/services/payments/xendit-payment.service";
import { logActivity } from "@/lib/activity";

// ── Input schemas ─────────────────────────────────────────────────────────────

const ClaimFreeSchema = z.object({
  resourceId: z.string().cuid("resourceId must be a valid CUID."),
});

const CheckoutSessionSchema = z.object({
  provider: z.enum(["stripe", "xendit"], {
    errorMap: () => ({ message: "provider must be \"stripe\" or \"xendit\"." }),
  }),
  resourceId: z.string().cuid("resourceId must be a valid CUID."),
});

// ── claimFreeResource ─────────────────────────────────────────────────────────

/**
 * Claims a free resource for `userId`, creating a COMPLETED purchase record.
 *
 * Idempotent: calling it multiple times for the same user + resource is safe.
 * Throws a PaymentServiceError (not LibraryServiceError) so the calling route
 * can handle errors uniformly.
 */
export async function claimFreeResource(body: unknown, userId: string) {
  const parsed = ClaimFreeSchema.safeParse(body);

  if (!parsed.success) {
    throw new PaymentServiceError(400, {
      error: parsed.error.errors[0].message,
    });
  }

  const { resourceId } = parsed.data;

  void logActivity({
    userId,
    action: "FREE_CLAIM_STARTED",
    entity: "purchase",
    entityId: resourceId,
    metadata: { resourceId },
  });

  try {
    const result = await addFreeResourceToLibrary(userId, resourceId);
    void logActivity({
      userId,
      action: "FREE_CLAIM_SUCCESS",
      entity: "purchase",
      entityId: resourceId,
      metadata: { resourceId },
    });
    return result;
  } catch (err) {
    if (err instanceof LibraryServiceError) {
      throw new PaymentServiceError(err.status, err.payload);
    }
    throw err;
  }
}

// ── createCheckoutSession ─────────────────────────────────────────────────────

/**
 * Creates a paid checkout session with the specified provider, returning
 * `{ data: { url } }` — a redirect URL to the provider's hosted checkout page.
 *
 * Purchase state is NOT set to COMPLETED here. Completion happens exclusively
 * via the provider's webhook after payment is confirmed.
 */
export async function createCheckoutSession(body: unknown, userId: string) {
  const parsed = CheckoutSessionSchema.safeParse(body);

  if (!parsed.success) {
    throw new PaymentServiceError(400, {
      error: parsed.error.errors[0].message,
    });
  }

  const { provider, resourceId } = parsed.data;

  if (provider === "stripe") {
    const result = await createStripeCheckout({ mode: "payment", resourceId }, userId);
    void logActivity({
      userId,
      action: "CHECKOUT_STARTED",
      entity: "purchase",
      entityId: resourceId,
      metadata: { provider: "stripe", resourceId },
    });
    return result;
  }

  const result = await createXenditCheckout({ resourceId }, userId);
  void logActivity({
    userId,
    action: "CHECKOUT_STARTED",
    entity: "purchase",
    entityId: resourceId,
    metadata: { provider: "xendit", resourceId },
  });
  return result;
}
