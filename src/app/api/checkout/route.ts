import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PaymentServiceError } from "@/services/payments/payment.service";
import { createLegacyStripeCheckout } from "@/services/payments/stripe-payment.service";

function handleServiceError(err: unknown) {
  if (err instanceof PaymentServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error("[CHECKOUT_POST]", err);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const result = await createLegacyStripeCheckout(body, session.user.id);

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err);
  }
}
