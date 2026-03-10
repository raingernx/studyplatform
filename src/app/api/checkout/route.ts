import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/checkout
 *
 * One-time resource purchase flow.
 * Accepts: { resourceId: string }
 *
 * Flow:
 *   1. Verify session
 *   2. Fetch resource – 404 if missing
 *   3. Reject free resources (no checkout needed)
 *   4. Guard against duplicate COMPLETED purchases
 *   5. Ensure a Stripe customer record exists for the user
 *   6. Create / reuse a Stripe Price for the resource
 *   7. Create a Stripe Checkout Session (mode: "payment")
 *   8. Upsert a PENDING Purchase row so the webhook can update it
 *   9. Return { url } — the client redirects there
 *
 * The webhook at /api/stripe/webhook listens for checkout.session.completed
 * and marks the purchase COMPLETED, making the resource visible in My Resources.
 */
export async function POST(req: Request) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase." },
        { status: 401 },
      );
    }

    // ── 2. Parse body ──────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { resourceId } = body as { resourceId?: string };

    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json(
        { error: "resourceId is required." },
        { status: 400 },
      );
    }

    // ── 3. Fetch resource ──────────────────────────────────────────────────────
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

    // ── 4. Prevent duplicate purchases ────────────────────────────────────────
    const existingPurchase = await prisma.purchase.findFirst({
      where: { userId: session.user.id, resourceId },
    });

    if (existingPurchase?.status === "COMPLETED") {
      return NextResponse.json(
        { error: "You already own this resource." },
        { status: 409 },
      );
    }

    // ── 5. Ensure Stripe customer exists ──────────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email ?? undefined,
        name: dbUser.name ?? undefined,
        metadata: { userId: dbUser.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    // ── 6. Create / reuse Stripe Price ────────────────────────────────────────
    let priceId = resource.stripePriceId;
    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: resource.price,
        currency: "usd",
        product_data: { name: resource.title },
      });
      priceId = price.id;
      // Cache the price ID on the resource so future checkouts reuse it
      await prisma.resource.update({
        where: { id: resourceId },
        data: { stripePriceId: priceId },
      });
    }

    // ── 7. Upsert Purchase first so we can attach purchaseId in metadata ─────
    const purchase = await prisma.purchase.upsert({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId,
        },
      },
      update: {
        status: "PENDING",
        paymentProvider: "STRIPE",
      },
      create: {
        userId: session.user.id,
        resourceId,
        amount: resource.price,
        currency: "usd",
        status: "PENDING",
        paymentProvider: "STRIPE",
      },
      select: { id: true },
    });

    // ── 8. Create Stripe Checkout Session ─────────────────────────────────────
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/resources?payment=success`,
      cancel_url: `${baseUrl}/resources/${resourceId}?payment=cancelled`,

      // Primary metadata — read by the webhook on checkout.session.completed.
      metadata: {
        purchaseId: purchase.id,
        userId: session.user.id,
        resourceId,
      },

      // Mirror metadata onto the PaymentIntent as well.
      // checkout.session.completed can arrive with empty session.metadata in
      // edge cases (e.g. stripe trigger, certain Stripe API versions).
      // Having it on the PaymentIntent means the webhook can always fall back
      // to stripe.paymentIntents.retrieve() and still resolve userId/resourceId.
      payment_intent_data: {
        metadata: {
          purchaseId: purchase.id,
          userId: session.user.id,
          resourceId,
        },
      },
    });

    console.log("CHECKOUT SESSION CREATED:", checkoutSession.id);

    // Attach the session ID to the existing PENDING purchase
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    // ── 9. Return checkout URL ─────────────────────────────────────────────────
    return NextResponse.json({ data: { url: checkoutSession.url } });
  } catch (err) {
    console.error("[CHECKOUT_POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
