import { DashboardV2CreatorProfileContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorProfileData } from "@/services/dashboard-v2/creator-profile.service";

export const metadata = {
  title: "Creator Profile",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorProfilePage() {
  const { userId } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorProfile,
  );
  const data = await getDashboardV2CreatorProfileData(userId);

  return <DashboardV2CreatorProfileContent data={data} />;
}
