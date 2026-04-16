import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserPreferences,
  updateUserPreferences,
  ALLOWED_THEMES,
  ALLOWED_CURRENCIES,
  ALLOWED_TIMEZONES,
  type Theme,
  type Currency,
  type Timezone,
} from "@/lib/preferences";

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

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
    theme,
    currency,
    timezone,
    emailNotifications,
    purchaseReceipts,
    productUpdates,
    marketingEmails,
  } = body as Record<string, unknown>;

  const updated = await updateUserPreferences(session.user.id, {
    theme: isOneOf<Theme>(theme, ALLOWED_THEMES) ? theme : undefined,
    currency: isOneOf<Currency>(currency, ALLOWED_CURRENCIES) ? currency : undefined,
    timezone: isOneOf<Timezone>(timezone, ALLOWED_TIMEZONES) ? timezone : undefined,
    emailNotifications: typeof emailNotifications === "boolean" ? emailNotifications : undefined,
    purchaseReceipts: typeof purchaseReceipts === "boolean" ? purchaseReceipts : undefined,
    productUpdates: typeof productUpdates === "boolean" ? productUpdates : undefined,
    marketingEmails: typeof marketingEmails === "boolean" ? marketingEmails : undefined,
  });

  return NextResponse.json({ data: updated });
}
