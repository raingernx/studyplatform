import { DashboardV2CreatorContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorOverviewData } from "@/services/dashboard-v2/creator-overview.service";

export const metadata = {
  title: "Creator Workspace",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorWorkspacePage() {
  const { userId, access } = await requireCreatorDashboardAccess(
    routes.dashboardV2Creator,
  );
  const data = await getDashboardV2CreatorOverviewData(userId, { access });

  return <DashboardV2CreatorContent data={data} />;
}
