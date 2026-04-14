import { DashboardV2CreatorSalesContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorEarningsData } from "@/services/dashboard-v2/creator-earnings.service";

export const metadata = {
  title: "Creator Earnings",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorSalesPage() {
  const { userId, access } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorSales,
  );
  const data = await getDashboardV2CreatorEarningsData({ userId, access });

  return <DashboardV2CreatorSalesContent data={data} />;
}
