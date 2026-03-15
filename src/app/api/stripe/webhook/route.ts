import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PaymentServiceError } from "@/services/payments/payment.service";
import {
  constructStripeWebhookEvent,
  handleStripeWebhookEvent,
} from "@/services/payments/stripe-webhook.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handleServiceError(err: unknown) {
  if (err instanceof PaymentServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error("[WEBHOOK] Unhandled handler error:", err);
  return NextResponse.json(
    { error: "Webhook handler failed." },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    console.error("[WEBHOOK] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = constructStripeWebhookEvent(body, signature);
    await handleStripeWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (err) {
    return handleServiceError(err);
  }
}
