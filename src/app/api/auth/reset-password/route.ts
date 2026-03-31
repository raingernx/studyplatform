import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/services/user-account.service";

const RequestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const rateLimit = await checkRateLimit(LIMITS.passwordReset, getClientIp(req));
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.reset),
            "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        },
      );
    }

    const body = await req.json();
    const parsed = RequestPasswordResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    await requestPasswordReset(parsed.data.email);

    return NextResponse.json(
      {
        message:
          "If an account exists for that email, a password reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[AUTH_RESET_PASSWORD_POST]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
