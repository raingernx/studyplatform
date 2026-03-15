import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { PaymentServiceError } from "@/services/payments/payment.service";
import { createStripeCheckout } from "@/services/payments/stripe-payment.service";

function handleServiceError(err: unknown) {
  if (err instanceof PaymentServiceError) {
    return NextResponse.json(err.payload, { status: err.status });
  }

  console.error("[STRIPE_CHECKOUT]", err);
  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(LIMITS.checkout, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many checkout requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to purchase." },
        { status: 401 },
      );
    }

    const result = await createStripeCheckout(await req.json(), session.user.id);

    return NextResponse.json(result);
  } catch (err) {
    return handleServiceError(err);
  }
}
