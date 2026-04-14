import { DashboardV2CreatorResourcesContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorResourcesData } from "@/services/dashboard-v2/creator-resources.service";

export const metadata = {
  title: "Creator Resources",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorResourcesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const { userId } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorResources,
  );
  const data = await getDashboardV2CreatorResourcesData({
    userId,
    rawStatus: params.status,
    rawPricing: params.pricing,
    rawSort: params.sort,
    rawCategory: params.category,
    rawPage: params.page,
  });

  return <DashboardV2CreatorResourcesContent data={data} />;
}
