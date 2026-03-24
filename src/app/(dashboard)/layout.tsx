import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getCreatorAccessState } from "@/services/creator.service";
import { traceServerStep } from "@/lib/performance/observability";

interface DashboardGroupLayoutProps {
  children: ReactNode;
}

/** Safe fallback used when the session is absent or creator-state lookup fails. */
const CREATOR_ACCESS_FALLBACK = {
  eligible: false,
  canCreate: false,
  role: null as null,
  resourceCount: 0,
  creatorEnabled: false,
  creatorStatus: "INACTIVE" as const,
  applicationStatus: "NOT_APPLIED" as const,
};

export default async function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  const session = await traceServerStep(
    "dashboard_layout.getServerSession",
    () => getServerSession(authOptions),
  );

  // Resolve creator access only after confirming a valid userId exists.
  // The .catch() ensures a transient DB error never crashes the dashboard shell.
  const creatorAccess = session?.user?.id
    ? await traceServerStep(
        "dashboard_layout.getCreatorAccessState",
        () =>
          getCreatorAccessState(session.user.id).catch(
            () => CREATOR_ACCESS_FALLBACK,
          ),
        { userId: session.user.id },
      )
    : CREATOR_ACCESS_FALLBACK;

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
    subscriptionStatus: session?.user?.subscriptionStatus ?? "INACTIVE",
    role: session?.user?.role ?? null,
    isCreator: creatorAccess.eligible,
    canCreateResources: creatorAccess.canCreate,
    creatorEnabled: creatorAccess.creatorEnabled,
  };

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
