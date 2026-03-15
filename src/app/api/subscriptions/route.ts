import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getUserSubscription } from "@/services/subscriptions/subscription.service";

// GET /api/subscriptions  –  returns the current user's subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await getUserSubscription(session.user.id);

    return NextResponse.json({ data: user });
  } catch (err) {
    console.error("[SUBSCRIPTIONS_GET]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/subscriptions  –  cancel the current user's subscription at period end
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
    }

    // Cancel at period end (not immediately)
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ data: { cancelAtPeriodEnd: true } });
  } catch (err) {
    console.error("[SUBSCRIPTIONS_DELETE]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
