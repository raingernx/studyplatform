import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPasswordReset } from "@/services/user-account.service";

const ConfirmPasswordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ConfirmPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const result = await confirmPasswordReset(parsed.data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error("[AUTH_RESET_PASSWORD_CONFIRM_POST]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
