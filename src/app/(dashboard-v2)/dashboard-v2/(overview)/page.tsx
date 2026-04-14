import { DashboardV2HomeContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2HomeData } from "@/services/dashboard-v2/home.service";

export const metadata = {
  title: {
    absolute: "Home | Dashboard V2 | Krukraft",
  },
};

export const dynamic = "force-dynamic";

export default async function DashboardV2OverviewPage() {
  const { userId, session } = await requireSession(routes.dashboardV2);
  const data = await getDashboardV2HomeData({
    userId,
    displayName: session.user.name ?? null,
    fallbackSubscriptionStatus: session.user.subscriptionStatus ?? null,
  });

  return <DashboardV2HomeContent data={data} />;
}
