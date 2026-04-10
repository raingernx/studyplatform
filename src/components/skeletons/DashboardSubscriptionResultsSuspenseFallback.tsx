import { getServerAuthTokenSnapshot } from "@/lib/auth/token-snapshot";
import { DashboardSubscriptionResultsSkeleton } from "@/components/skeletons/DashboardUserRouteSkeletons";

export async function DashboardSubscriptionResultsSuspenseFallback() {
  const tokenSnapshot = await getServerAuthTokenSnapshot();
  const planVariant =
    tokenSnapshot.subscriptionStatus === "ACTIVE" ||
    tokenSnapshot.subscriptionStatus === "TRIALING"
      ? "active"
      : tokenSnapshot.authenticated
        ? "free"
        : "unknown";

  return <DashboardSubscriptionResultsSkeleton planVariant={planVariant} />;
}
