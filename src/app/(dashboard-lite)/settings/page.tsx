import { redirect } from "next/navigation";

import { getCachedServerSession } from "@/lib/auth";
import { getServerAuthTokenSnapshot } from "@/lib/auth/token-snapshot";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { getDashboardSettingsPageData } from "@/services/admin";
import { routes } from "@/lib/routes";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";

export const metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

async function SettingsTabsContent() {
  const tokenSnapshot = await getServerAuthTokenSnapshot();
  const session =
    !tokenSnapshot.authenticated || !tokenSnapshot.userId
      ? await getCachedServerSession()
      : null;

  const userId = tokenSnapshot.userId ?? session?.user?.id ?? null;

  if (!userId) {
    redirect(routes.loginWithNext(routes.settings));
  }

  const { user, preferences } = await getDashboardSettingsPageData({
    userId,
    fallbackUser: {
      name: tokenSnapshot.name ?? session?.user?.name ?? null,
      email: tokenSnapshot.email ?? session?.user?.email ?? null,
      image: tokenSnapshot.image ?? session?.user?.image ?? null,
    },
  });

  return (
    <DashboardPageStack>
      <SettingsTabs
        user={{
          name: user?.name ?? null,
          email: user?.email ?? null,
          image: user?.image ?? null,
        }}
        preferences={preferences}
      />
    </DashboardPageStack>
  );
}

export default async function SettingsPage() {
  const settingsTabs = await SettingsTabsContent();

  return (
    <DashboardPageShell routeReady="dashboard-settings" width="narrow">
      <DashboardPageHeader
        title="Settings"
        description="Manage your account preferences and security."
      />
      {settingsTabs}
    </DashboardPageShell>
  );
}
