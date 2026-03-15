import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PreferenceSettings } from "@/components/settings/PreferenceSettings";
import { DangerZone } from "@/components/settings/DangerZone";

type SettingsTabsProps = {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  preferences: {
    language: string;
    theme: string;
    currency: string;
    timezone: string;
    emailNotifications: boolean;
    purchaseReceipts: boolean;
    productUpdates: boolean;
    marketingEmails: boolean;
  };
};

export function SettingsTabs({ user, preferences }: SettingsTabsProps) {
  return (
    <div className="space-y-6">
      <ProfileSettings
        name={user?.name}
        email={user?.email}
        image={user?.image}
      />
      <SecuritySettings />
      <NotificationSettings
        emailNotifications={preferences.emailNotifications}
        purchaseReceipts={preferences.purchaseReceipts}
        productUpdates={preferences.productUpdates}
        marketingEmails={preferences.marketingEmails}
      />
      <PreferenceSettings
        language={preferences.language as any}
        theme={preferences.theme as any}
        currency={preferences.currency as any}
        timezone={preferences.timezone as any}
      />
      <DangerZone />
    </div>
  );
}
