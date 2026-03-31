import { NextResponse } from "next/server";
import { routes } from "@/lib/routes";
import { confirmEmailVerification } from "@/services/user-account.service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL(`${routes.login}?verify=invalid`, url.origin));
  }

  try {
    const result = await confirmEmailVerification(token);
    if ("error" in result) {
      return NextResponse.redirect(new URL(`${routes.login}?verify=invalid`, url.origin));
    }

    return NextResponse.redirect(new URL(`${routes.login}?verified=1`, url.origin));
  } catch (error) {
    console.error("[AUTH_VERIFY_EMAIL_GET]", error);
    return NextResponse.redirect(new URL(`${routes.login}?verify=invalid`, url.origin));
  }
}
