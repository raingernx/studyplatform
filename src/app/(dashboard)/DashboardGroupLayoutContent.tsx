import type { ReactNode } from "react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getCreatorAccessState } from "@/services/creator";
import { getCachedServerSession } from "@/lib/auth";
import { getServerAuthTokenSnapshot } from "@/lib/auth/token-snapshot";
import { traceServerStep } from "@/lib/performance/observability";

interface DashboardGroupLayoutContentProps {
  children: ReactNode;
}

const CREATOR_ACCESS_FALLBACK = {
  eligible: false,
  canCreate: false,
  role: null as null,
  resourceCount: 0,
  creatorEnabled: false,
  creatorStatus: "INACTIVE" as const,
  applicationStatus: "NOT_APPLIED" as const,
};

/**
 * Resolve dashboard shell viewer state behind a family-scoped Suspense boundary
 * so hard refreshes land on the dashboard loading shell rather than the app root
 * fallback while the session/creator state is loading.
 */
export default async function DashboardGroupLayoutContent({
  children,
}: DashboardGroupLayoutContentProps) {
  const tokenSnapshot = await traceServerStep(
    "dashboard_layout.getTokenSnapshot",
    () => getServerAuthTokenSnapshot(),
  );

  const session =
    !tokenSnapshot.authenticated || !tokenSnapshot.userId
      ? await traceServerStep("dashboard_layout.getServerSessionFallback", () =>
          getCachedServerSession(),
        )
      : null;

  const userId = tokenSnapshot.userId ?? session?.user?.id ?? null;
  const role = tokenSnapshot.role ?? session?.user?.role ?? null;
  const shouldResolveCreatorAccess = Boolean(
    userId &&
    role !== "ADMIN" &&
    role !== "INSTRUCTOR",
  );

  const creatorAccess = shouldResolveCreatorAccess && userId
    ? await traceServerStep(
        "dashboard_layout.getCreatorAccessStateFallback",
        () => getCreatorAccessState(userId).catch(() => CREATOR_ACCESS_FALLBACK),
        { userId },
      )
    : CREATOR_ACCESS_FALLBACK;

  const isCreator = role === "INSTRUCTOR" || creatorAccess.eligible;

  const user = {
    name: tokenSnapshot.name ?? session?.user?.name ?? null,
    email: tokenSnapshot.email ?? session?.user?.email ?? null,
    image: tokenSnapshot.image ?? session?.user?.image ?? null,
    subscriptionStatus:
      tokenSnapshot.subscriptionStatus ??
      session?.user?.subscriptionStatus ??
      "INACTIVE",
    role,
    isCreator,
    canCreateResources:
      role === "ADMIN" || role === "INSTRUCTOR" || creatorAccess.canCreate,
    creatorEnabled: role === "INSTRUCTOR" || creatorAccess.creatorEnabled,
  };

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
