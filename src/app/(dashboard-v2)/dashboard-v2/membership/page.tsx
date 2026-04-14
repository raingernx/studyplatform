import { DashboardV2MembershipContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2MembershipData } from "@/services/dashboard-v2/membership.service";

export const metadata = {
  title: "Membership",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2MembershipPage() {
  const { userId, session } = await requireSession(routes.dashboardV2Membership);
  const data = await getDashboardV2MembershipData({
    userId,
    fallbackSubscriptionStatus: session.user.subscriptionStatus ?? null,
  });

  return <DashboardV2MembershipContent data={data} />;
}
