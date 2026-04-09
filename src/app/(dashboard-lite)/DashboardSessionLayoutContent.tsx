import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getCachedServerSession } from "@/lib/auth";
import { getServerAuthTokenSnapshot } from "@/lib/auth/token-snapshot";
import { traceServerStep } from "@/lib/performance/observability";
import { routes } from "@/lib/routes";

interface DashboardSessionLayoutContentProps {
  children: ReactNode;
}

/**
 * Session-only dashboard shell for lightweight dashboard routes that do not
 * need DB-backed creator access before the shell becomes usable.
 */
export default async function DashboardSessionLayoutContent({
  children,
}: DashboardSessionLayoutContentProps) {
  const tokenSnapshot = await traceServerStep(
    "dashboard_layout_lite.getTokenSnapshot",
    () => getServerAuthTokenSnapshot(),
  );

  const session =
    !tokenSnapshot.authenticated || !tokenSnapshot.userId
      ? await traceServerStep("dashboard_layout_lite.getServerSessionFallback", () =>
          getCachedServerSession(),
        )
      : null;

  if (!tokenSnapshot.authenticated && !session?.user?.id) {
    redirect(routes.loginWithNext(routes.dashboard));
  }

  const role = tokenSnapshot.role ?? session?.user?.role ?? null;
  const isCreator = role === "INSTRUCTOR";

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
    canCreateResources: isCreator || role === "ADMIN",
    creatorEnabled: isCreator,
  };

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
