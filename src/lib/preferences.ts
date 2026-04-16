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
  theme: "system",
  currency: "USD",
  timezone: "UTC",
  emailNotifications: true,
  purchaseReceipts: true,
  productUpdates: true,
  marketingEmails: false,
};

function normalizeUserPreferences(
  preferences: Partial<Record<keyof UserPreferences, string | boolean>> | null,
): UserPreferences {
  if (!preferences) {
    return DEFAULT_USER_PREFERENCES;
  }

  return {
    language: isOneOf(
      typeof preferences.language === "string"
        ? preferences.language
        : DEFAULT_USER_PREFERENCES.language,
      ALLOWED_LANGUAGES,
    )
      ? (preferences.language as Language)
      : DEFAULT_USER_PREFERENCES.language,
    theme: isOneOf(
      typeof preferences.theme === "string"
        ? preferences.theme
        : DEFAULT_USER_PREFERENCES.theme,
      ALLOWED_THEMES,
    )
      ? (preferences.theme as Theme)
      : DEFAULT_USER_PREFERENCES.theme,
    currency: isOneOf(
      typeof preferences.currency === "string"
        ? preferences.currency
        : DEFAULT_USER_PREFERENCES.currency,
      ALLOWED_CURRENCIES,
    )
      ? (preferences.currency as Currency)
      : DEFAULT_USER_PREFERENCES.currency,
    timezone: isOneOf(
      typeof preferences.timezone === "string"
        ? preferences.timezone
        : DEFAULT_USER_PREFERENCES.timezone,
      ALLOWED_TIMEZONES,
    )
      ? (preferences.timezone as Timezone)
      : DEFAULT_USER_PREFERENCES.timezone,
    emailNotifications:
      typeof preferences.emailNotifications === "boolean"
        ? preferences.emailNotifications
        : DEFAULT_USER_PREFERENCES.emailNotifications,
    purchaseReceipts:
      typeof preferences.purchaseReceipts === "boolean"
        ? preferences.purchaseReceipts
        : DEFAULT_USER_PREFERENCES.purchaseReceipts,
    productUpdates:
      typeof preferences.productUpdates === "boolean"
        ? preferences.productUpdates
        : DEFAULT_USER_PREFERENCES.productUpdates,
    marketingEmails:
      typeof preferences.marketingEmails === "boolean"
        ? preferences.marketingEmails
        : DEFAULT_USER_PREFERENCES.marketingEmails,
  };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
    select: USER_PREFERENCE_SELECT,
  });

  if (!preferences && env.NODE_ENV !== "production") {
    console.warn(
      `getUserPreferences: no preference row for user ${userId}; returning defaults`,
    );
  }

  return normalizeUserPreferences(preferences);
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
