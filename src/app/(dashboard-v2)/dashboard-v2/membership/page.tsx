import { DashboardV2MembershipStreamedContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2MembershipData } from "@/services/dashboard-v2/membership.service";

export const metadata = {
  title: "Membership",
};

export const dynamic = "force-dynamic";

type DashboardV2MembershipPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardV2MembershipPage({
  searchParams,
}: DashboardV2MembershipPageProps) {
  const { userId, session } = await requireSession(routes.dashboardV2Membership);
  const params = searchParams ? await searchParams : {};
  const subscriptionState =
    typeof params.subscription === "string" ? params.subscription : null;
  const dataPromise = getDashboardV2MembershipData({
    userId,
    fallbackSubscriptionStatus: session.user.subscriptionStatus ?? null,
  });

  return (
    <DashboardV2MembershipStreamedContent
      dataPromise={dataPromise}
      subscriptionState={subscriptionState}
    />
  );
}
