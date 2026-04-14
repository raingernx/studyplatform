import { formatDate } from "@/lib/format";
import type { UserPreferences } from "@/lib/preferences";
import { getDashboardSettingsPageData } from "@/services/admin";

function toTitleCase(value: string) {
  return value
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getNotificationsSummary(preferences: UserPreferences) {
  const enabled = [
    preferences.emailNotifications ? "account alerts" : null,
    preferences.purchaseReceipts ? "receipts" : null,
    preferences.productUpdates ? "product updates" : null,
    preferences.marketingEmails ? "marketing" : null,
  ].filter(Boolean) as string[];

  if (enabled.length === 0) {
    return "All email notifications are turned off.";
  }

  if (enabled.length === 1) {
    return `${enabled[0]} enabled.`;
  }

  return `${enabled.slice(0, -1).join(", ")} and ${enabled.at(-1)} enabled.`;
}

export interface DashboardV2SettingsData {
  state: "ready" | "error";
  profile: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
    joinedLabel: string;
    note: string;
  };
  preferences: {
    theme: string;
    language: string;
    currency: string;
    timezone: string;
    notificationsSummary: string;
  };
  security: {
    accountLabel: string;
    accountDetail: string;
    routeLabel: string;
    routeDetail: string;
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
    const joinedDate =
      user && "createdAt" in user && user.createdAt instanceof Date
        ? user.createdAt
        : null;

    return {
      state: "ready",
      profile: {
        displayName: user?.name?.trim() || "Account user",
        email: user?.email?.trim() || "No email on file",
        avatarUrl: user?.image ?? null,
        joinedLabel: joinedDate ? formatDate(joinedDate) : "Unavailable",
        note: user?.name?.trim()
          ? "Public account identity is configured."
          : "Add a display name when profile editing is connected to this route.",
      },
      preferences: {
        theme: toTitleCase(preferences.theme),
        language: toTitleCase(preferences.language),
        currency: preferences.currency,
        timezone: preferences.timezone,
        notificationsSummary: getNotificationsSummary(preferences),
      },
      security: {
        accountLabel: user?.email?.trim()
          ? "Primary account email on file"
          : "Primary account email missing",
        accountDetail: user?.email?.trim()
          ? "This email is the recovery and account notice contact for the dashboard."
          : "Add an account email before relying on recovery or billing notices.",
        routeLabel: "Authenticated dashboard route",
        routeDetail:
          "Settings only render after the dashboard-v2 session gate confirms the signed-in user.",
        helpText:
          "Billing changes live in Membership. Order receipts and payment history stay in Purchases.",
      },
    };
  } catch {
    return {
      state: "error",
      profile: {
        displayName: "Unavailable",
        email: "Unavailable",
        avatarUrl: null,
        joinedLabel: "Unavailable",
        note: "Unavailable",
      },
      preferences: {
        theme: "Unavailable",
        language: "Unavailable",
        currency: "Unavailable",
        timezone: "Unavailable",
        notificationsSummary: "Unavailable",
      },
      security: {
        accountLabel: "Unavailable",
        accountDetail: "Unavailable",
        routeLabel: "Unavailable",
        routeDetail: "Unavailable",
        helpText: "Try reloading this route.",
      },
      errorTitle: "Could not load settings",
      errorDescription:
        "Try refreshing this page. Your account settings remain protected behind the authenticated dashboard shell.",
    };
  }
}
