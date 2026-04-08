import { Suspense } from "react";

import { requireSession } from "@/lib/auth/require-session";
import { PageContentNarrow, SectionHeader } from "@/design-system";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SettingsTabsSkeleton } from "@/components/skeletons/SettingsPageSkeleton";
import { getDashboardSettingsPageData } from "@/services/admin";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

async function SettingsTabsContent({ userId }: { userId: string }) {
  const { user, preferences } = await getDashboardSettingsPageData(userId);

  return (
    <SettingsTabs
      user={{
        name: user?.name ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
      }}
      preferences={preferences}
    />
  );
}

export default async function SettingsPage() {
  const { userId } = await requireSession(routes.settings);

  return (
    <PageContentNarrow data-route-shell-ready="dashboard-settings" className="space-y-8">
      <SectionHeader
        title="Settings"
        description="Manage your account preferences and security."
      />
      <Suspense fallback={<SettingsTabsSkeleton />}>
        <SettingsTabsContent userId={userId} />
      </Suspense>
    </PageContentNarrow>
  );
}
