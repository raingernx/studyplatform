import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCachedServerSession } from "@/lib/auth";
import { PageContentNarrow, SectionHeader } from "@/design-system";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SettingsTabsSkeleton } from "@/components/skeletons/SettingsPageSkeleton";
import { getDashboardSettingsPageData } from "@/services/admin";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

async function SettingsTabsContent() {
  const session = await getCachedServerSession();

  if (!session?.user?.id) {
    redirect(routes.loginWithNext(routes.settings));
  }

  const { user, preferences } = await getDashboardSettingsPageData({
    userId: session.user.id,
    fallbackUser: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  });

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

export default function SettingsPage() {
  return (
    <PageContentNarrow data-route-shell-ready="dashboard-settings" className="space-y-8">
      <SectionHeader
        title="Settings"
        description="Manage your account preferences and security."
      />
      <Suspense fallback={<SettingsTabsSkeleton />}>
        <SettingsTabsContent />
      </Suspense>
    </PageContentNarrow>
  );
}
