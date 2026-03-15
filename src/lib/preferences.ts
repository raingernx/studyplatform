import { prisma } from "@/lib/prisma";

const ALLOWED_LANGUAGES = ["th", "en"] as const;
const ALLOWED_THEMES = ["light", "dark", "system"] as const;
const ALLOWED_CURRENCIES = ["THB", "USD"] as const;
const ALLOWED_TIMEZONES = ["Asia/Bangkok", "UTC"] as const;

type Language = (typeof ALLOWED_LANGUAGES)[number];
type Theme = (typeof ALLOWED_THEMES)[number];
type Currency = (typeof ALLOWED_CURRENCIES)[number];
type Timezone = (typeof ALLOWED_TIMEZONES)[number];

export type UserPreferences = {
  language: Language;
  theme: Theme;
  currency: Currency;
  timezone: Timezone;
  emailNotifications: boolean;
  purchaseReceipts: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
};

type PreferenceUpdate = Partial<UserPreferences>;

export async function getUserPreferences(userId: string) {
  // Guard: ensure the User row exists before touching UserPreference.
  // A missing user means the JWT is stale (account deleted) — propagate as
  // a thrown error so the caller can redirect rather than hit a FK violation.
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    throw new Error(`getUserPreferences: user ${userId} not found`);
  }

  // upsert instead of findUnique → create:
  //  - avoids a FK violation when userId is valid but preferences don't exist yet
  //  - eliminates the TOCTOU race if two requests arrive simultaneously
  return prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function updateUserPreferences(userId: string, data: PreferenceUpdate) {
  const safe: PreferenceUpdate = {};

  if (data.language && ALLOWED_LANGUAGES.includes(data.language)) {
    safe.language = data.language;
  }
  if (data.theme && ALLOWED_THEMES.includes(data.theme)) {
    safe.theme = data.theme;
  }
  if (data.currency && ALLOWED_CURRENCIES.includes(data.currency)) {
    safe.currency = data.currency;
  }
  if (data.timezone && ALLOWED_TIMEZONES.includes(data.timezone)) {
    safe.timezone = data.timezone;
  }

  if (typeof data.emailNotifications === "boolean") {
    safe.emailNotifications = data.emailNotifications;
  }
  if (typeof data.purchaseReceipts === "boolean") {
    safe.purchaseReceipts = data.purchaseReceipts;
  }
  if (typeof data.productUpdates === "boolean") {
    safe.productUpdates = data.productUpdates;
  }
  if (typeof data.marketingEmails === "boolean") {
    safe.marketingEmails = data.marketingEmails;
  }

  return prisma.userPreference.upsert({
    where: { userId },
    update: safe,
    create: {
      userId,
      ...safe,
    },
  });
}

