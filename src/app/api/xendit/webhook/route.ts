import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PaymentServiceError } from "@/services/payments/payment.service";
import {
  assertValidXenditWebhookToken,
  handleXenditWebhookPayload,
} from "@/services/payments/xendit-webhook.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handleServiceError(err: unknown) {
  if (err instanceof PaymentServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error("[XENDIT WEBHOOK] Handler error:", err);
  return NextResponse.json(
    { error: "Webhook handler failed." },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  try {
    assertValidXenditWebhookToken((await headers()).get("x-callback-token"));
  } catch (err) {
    return handleServiceError(err);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    console.error("[XENDIT WEBHOOK] Failed to parse JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await handleXenditWebhookPayload(payload);
    return NextResponse.json({ received: true });
  } catch (err) {
    return handleServiceError(err);
  }
}
