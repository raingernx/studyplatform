import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getCreatorAccessState } from "@/services/creator.service";

interface DashboardGroupLayoutProps {
  children: ReactNode;
}

export default async function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  const session = await getServerSession(authOptions);
  const creatorAccess = session?.user?.id
    ? await getCreatorAccessState(session.user.id)
    : {
        eligible: false,
        canCreate: false,
        role: null,
        resourceCount: 0,
        creatorEnabled: false,
      };

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
