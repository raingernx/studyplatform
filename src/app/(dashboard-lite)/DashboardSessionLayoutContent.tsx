import type { ReactNode } from "react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getCachedServerSession } from "@/lib/auth";
import { traceServerStep } from "@/lib/performance/observability";

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
  const session = await traceServerStep(
    "dashboard_layout_lite.getServerSession",
    () => getCachedServerSession(),
  );

  const role = session?.user?.role ?? null;
  const isCreator = role === "INSTRUCTOR";

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
    subscriptionStatus: session?.user?.subscriptionStatus ?? "INACTIVE",
    role,
    isCreator,
    canCreateResources: isCreator || role === "ADMIN",
    creatorEnabled: isCreator,
  };

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
