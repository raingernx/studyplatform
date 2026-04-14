import { DashboardV2CreatorSettingsContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorSettingsData } from "@/services/dashboard-v2/creator-settings.service";

export const metadata = {
  title: "Creator Settings",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorSettingsPage() {
  const { userId } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorSettings,
  );
  const data = await getDashboardV2CreatorSettingsData(userId);

  return <DashboardV2CreatorSettingsContent data={data} />;
}
