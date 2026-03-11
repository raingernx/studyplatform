import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/stripe";

const CheckoutSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("payment"),
    resourceId: z.string().cuid(),
  }),
  z.object({
    mode: z.literal("subscription"),
    plan: z.enum(["pro_monthly", "pro_annual"]),
  }),
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to purchase." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    // ── One-time purchase ─────────────────────────────────────────────────────
    if (parsed.data.mode === "payment") {
      const { resourceId } = parsed.data;

      const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
      if (!resource) {
        return NextResponse.json({ error: "Resource not found." }, { status: 404 });
      }
      if (resource.isFree || resource.price === 0) {
        return NextResponse.json({ error: "This resource is free — no checkout needed." }, { status: 400 });
      }

      // Check not already purchased
      const existing = await prisma.purchase.findUnique({
        where: { userId_resourceId: { userId: user.id, resourceId } },
      });
      if (existing?.status === "COMPLETED") {
        return NextResponse.json({ error: "You already own this resource." }, { status: 409 });
      }

      const unitAmount = resource.price * 100;

      // Upsert a pending Purchase first so we can attach purchaseId in metadata
      const purchase = await prisma.purchase.upsert({
        where: { userId_resourceId: { userId: user.id, resourceId } },
        update: {
          status: "PENDING",
          paymentProvider: "STRIPE",
        },
        create: {
          userId: user.id,
          resourceId,
          amount: unitAmount,
          currency: "thb",
          status: "PENDING",
          paymentProvider: "STRIPE",
        },
        select: { id: true },
      });

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "thb",
              unit_amount: unitAmount,
              product_data: { name: resource.title },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/resources/id/${resourceId}?payment=success`,
        cancel_url: `${baseUrl}/resources/id/${resourceId}?payment=cancelled`,
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
      });

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { stripeSessionId: checkoutSession.id },
      });

      return NextResponse.json({ data: { url: checkoutSession.url } });
    }

    // ── Subscription ──────────────────────────────────────────────────────────
    const plan = parsed.data.plan as SubscriptionPlan;
    const priceId = SUBSCRIPTION_PLANS[plan];

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?subscription=success`,
      cancel_url: `${baseUrl}/pricing?subscription=cancelled`,
      subscription_data: { metadata: { userId: user.id, plan } },
    });

    return NextResponse.json({ data: { url: checkoutSession.url } });
  } catch (err) {
    console.error("[STRIPE_CHECKOUT]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
