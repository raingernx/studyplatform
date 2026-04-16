import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PreferenceSettings } from "@/components/settings/PreferenceSettings";
import { DangerZone } from "@/components/settings/DangerZone";
import type { UserPreferences } from "@/lib/preferences";

type SettingsTabsProps = {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  preferences: UserPreferences;
};

export function SettingsTabs({ user, preferences }: SettingsTabsProps) {
  return (
    <div className="space-y-0">
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
        theme={preferences.theme}
      />
      <DangerZone />
    </div>
  );
}
