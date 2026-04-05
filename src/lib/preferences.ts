import { prisma } from "@/lib/prisma";
import { env } from "@/env";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export const ALLOWED_LANGUAGES = ["th", "en"] as const;
export const ALLOWED_THEMES = ["light", "dark", "system"] as const;
export const ALLOWED_CURRENCIES = ["THB", "USD"] as const;
export const ALLOWED_TIMEZONES = ["Asia/Bangkok", "UTC"] as const;

export type Language = (typeof ALLOWED_LANGUAGES)[number];
export type Theme = (typeof ALLOWED_THEMES)[number];
export type Currency = (typeof ALLOWED_CURRENCIES)[number];
export type Timezone = (typeof ALLOWED_TIMEZONES)[number];

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

const USER_PREFERENCE_SELECT = {
  language: true,
  theme: true,
  currency: true,
  timezone: true,
  emailNotifications: true,
  purchaseReceipts: true,
  productUpdates: true,
  marketingEmails: true,
} as const;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: "en",
  theme: "light",
  currency: "USD",
  timezone: "UTC",
  emailNotifications: true,
  purchaseReceipts: true,
  productUpdates: true,
  marketingEmails: false,
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Guard: ensure the User row exists before touching UserPreference.
  // A missing user usually means the session is stale in local/dev. Return
  // safe defaults so settings can render instead of crashing the page.
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    if (env.NODE_ENV !== "production") {
      console.warn(`getUserPreferences: user ${userId} not found; returning defaults`);
    }

    return DEFAULT_USER_PREFERENCES;
  }

  // upsert instead of findUnique → create:
  //  - avoids a FK violation when userId is valid but preferences don't exist yet
  //  - eliminates the TOCTOU race if two requests arrive simultaneously
  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...DEFAULT_USER_PREFERENCES,
    },
    select: USER_PREFERENCE_SELECT,
  });

  return {
    language: isOneOf(preferences.language, ALLOWED_LANGUAGES) ? preferences.language : DEFAULT_USER_PREFERENCES.language,
    theme: isOneOf(preferences.theme, ALLOWED_THEMES) ? preferences.theme : DEFAULT_USER_PREFERENCES.theme,
    currency: isOneOf(preferences.currency, ALLOWED_CURRENCIES) ? preferences.currency : DEFAULT_USER_PREFERENCES.currency,
    timezone: isOneOf(preferences.timezone, ALLOWED_TIMEZONES) ? preferences.timezone : DEFAULT_USER_PREFERENCES.timezone,
    emailNotifications: preferences.emailNotifications,
    purchaseReceipts: preferences.purchaseReceipts,
    productUpdates: preferences.productUpdates,
    marketingEmails: preferences.marketingEmails,
  };
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
      ...DEFAULT_USER_PREFERENCES,
      ...safe,
    },
  });
}
