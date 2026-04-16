import { formatDate } from "@/lib/format";
import type { Currency, Theme, Timezone, UserPreferences } from "@/lib/preferences";
import { getDashboardSettingsPageData } from "@/services/admin";

export interface DashboardV2SettingsData {
  state: "ready" | "error";
  profile: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
    providerAvatarUrl: string | null;
    providerLabel: string | null;
  };
  preferences: {
    theme: Theme;
    currency: Currency;
    timezone: Timezone;
  };
  notifications: Pick<
    UserPreferences,
    "emailNotifications" | "purchaseReceipts" | "productUpdates" | "marketingEmails"
  >;
  accountAccess: {
    email: string;
    signInMethodLabel: string;
    canResetPassword: boolean;
    currentPlanLabel: string;
    memberSinceLabel: string;
    helpText: string;
  };
  errorTitle?: string;
  errorDescription?: string;
}

export async function getDashboardV2SettingsData(input: {
  userId: string;
  fallbackUser?: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}): Promise<DashboardV2SettingsData> {
  try {
    const { user, preferences } = await getDashboardSettingsPageData({
      userId: input.userId,
      fallbackUser: input.fallbackUser,
    });
    const linkedProviders =
      user && "accounts" in user && Array.isArray(user.accounts)
        ? user.accounts.map((account) => account.provider)
        : [];
    const hasGoogleProvider = linkedProviders.includes("google");
    const currentAvatarUrl =
      user && "image" in user && typeof user.image === "string" && user.image.trim().length > 0
        ? user.image.trim()
        : null;
    const rawProviderAvatarUrl =
      user && "providerImage" in user && typeof user.providerImage === "string"
        ? user.providerImage.trim() || null
        : null;
    const inferredProviderAvatarUrl =
      hasGoogleProvider &&
      !rawProviderAvatarUrl &&
      currentAvatarUrl?.includes("googleusercontent.com")
        ? currentAvatarUrl
        : null;
    const hasPassword =
      user && "hashedPassword" in user && typeof user.hashedPassword === "string"
        ? user.hashedPassword.trim().length > 0
        : false;
    const joinedDate =
      user && "createdAt" in user && user.createdAt instanceof Date
        ? user.createdAt
        : null;
    const subscriptionPlan =
      user && "subscriptionPlan" in user && typeof user.subscriptionPlan === "string"
        ? user.subscriptionPlan
        : null;
    const subscriptionStatus =
      user && "subscriptionStatus" in user && typeof user.subscriptionStatus === "string"
        ? user.subscriptionStatus.toUpperCase()
        : "INACTIVE";
    const currentPlanLabel = subscriptionPlan
      ? subscriptionPlan
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ")
      : subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING"
        ? "Active membership"
        : "Free plan";

    return {
      state: "ready",
      profile: {
        displayName: user?.name?.trim() || "Account user",
        email: user?.email?.trim() || "No email on file",
        avatarUrl: currentAvatarUrl,
        providerAvatarUrl: rawProviderAvatarUrl ?? inferredProviderAvatarUrl,
        providerLabel: hasGoogleProvider ? "Google" : null,
      },
      preferences: {
        theme: preferences.theme,
        currency: preferences.currency,
        timezone: preferences.timezone,
      },
      notifications: {
        emailNotifications: preferences.emailNotifications,
        purchaseReceipts: preferences.purchaseReceipts,
        productUpdates: preferences.productUpdates,
        marketingEmails: preferences.marketingEmails,
      },
      accountAccess: {
        email: user?.email?.trim() || "No email on file",
        signInMethodLabel:
          hasGoogleProvider && hasPassword
            ? "Google and password"
            : hasGoogleProvider
              ? "Google account"
              : hasPassword
                ? "Email and password"
                : "Email sign-in",
        canResetPassword: hasPassword,
        currentPlanLabel,
        memberSinceLabel: joinedDate ? formatDate(joinedDate) : "Unavailable",
        helpText: "Membership handles billing. Purchases keeps receipt history.",
      },
    };
  } catch {
    return {
      state: "error",
      profile: {
        displayName: "Unavailable",
        email: "Unavailable",
        avatarUrl: null,
        providerAvatarUrl: null,
        providerLabel: null,
      },
      preferences: {
        theme: "system",
        currency: "THB",
        timezone: "Asia/Bangkok",
      },
      notifications: {
        emailNotifications: false,
        purchaseReceipts: false,
        productUpdates: false,
        marketingEmails: false,
      },
      accountAccess: {
        email: "Unavailable",
        signInMethodLabel: "Unavailable",
        canResetPassword: false,
        currentPlanLabel: "Unavailable",
        memberSinceLabel: "Unavailable",
        helpText: "Try reloading this route.",
      },
      errorTitle: "Could not load settings",
      errorDescription:
        "Try refreshing this page. Your account settings remain protected behind the authenticated dashboard shell.",
    };
  }
}
