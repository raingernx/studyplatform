import { DashboardV2CreatorAnalyticsContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorAnalyticsData } from "@/services/dashboard-v2/creator-analytics.service";

export const metadata = {
  title: "Creator Analytics",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorAnalyticsPage() {
  const { userId } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorAnalytics,
  );
  const data = await getDashboardV2CreatorAnalyticsData({ userId });

  return <DashboardV2CreatorAnalyticsContent data={data} />;
}
