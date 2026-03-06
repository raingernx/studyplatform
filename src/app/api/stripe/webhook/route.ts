import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Disable body parsing – Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[STRIPE_WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── One-time payment completed ──────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          const { userId, resourceId } = session.metadata ?? {};
          if (userId && resourceId) {
            await prisma.purchase.updateMany({
              where: { stripeSessionId: session.id },
              data: {
                status: "COMPLETED",
                stripePaymentIntentId: session.payment_intent as string,
              },
            });
            // Increment download count
            await prisma.resource.update({
              where: { id: resourceId },
              data: { downloadCount: { increment: 1 } },
            });
          }
        }

        if (session.mode === "subscription") {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const { userId, plan } = sub.metadata ?? {};
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                stripeSubscriptionId: sub.id,
                subscriptionStatus: "ACTIVE",
                subscriptionPlan: plan ?? null,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              },
            });
          }
        }
        break;
      }

      // ── Subscription updated (renewal, upgrade, downgrade) ─────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: sub.status.toUpperCase() as any,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        }
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "CANCELED", stripeSubscriptionId: null },
          });
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }

      default:
        // Unhandled event – safe to ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[STRIPE_WEBHOOK] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
