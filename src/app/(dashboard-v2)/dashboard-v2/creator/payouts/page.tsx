import { DashboardV2CreatorPayoutsContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorEarningsData } from "@/services/dashboard-v2/creator-earnings.service";

export const metadata = {
  title: "Creator Payouts",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorPayoutsPage() {
  const { userId, access } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorPayouts,
  );
  const data = await getDashboardV2CreatorEarningsData({ userId, access });

  return <DashboardV2CreatorPayoutsContent data={data} />;
}
