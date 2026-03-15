import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPreferences, updateUserPreferences } from "@/lib/preferences";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getUserPreferences(session.user.id);
  return NextResponse.json({ data: prefs });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    language,
    theme,
    currency,
    timezone,
    emailNotifications,
    purchaseReceipts,
    productUpdates,
    marketingEmails,
  } = body as Record<string, unknown>;

  const updated = await updateUserPreferences(session.user.id, {
    language: typeof language === "string" ? (language as any) : undefined,
    theme: typeof theme === "string" ? (theme as any) : undefined,
    currency: typeof currency === "string" ? (currency as any) : undefined,
    timezone: typeof timezone === "string" ? (timezone as any) : undefined,
    emailNotifications: typeof emailNotifications === "boolean" ? emailNotifications : undefined,
    purchaseReceipts: typeof purchaseReceipts === "boolean" ? purchaseReceipts : undefined,
    productUpdates: typeof productUpdates === "boolean" ? productUpdates : undefined,
    marketingEmails: typeof marketingEmails === "boolean" ? marketingEmails : undefined,
  });

  return NextResponse.json({ data: updated });
}

