import type { ReactNode } from "react";

import { getCachedServerSession } from "@/lib/auth";
import {
  DashboardV2Sidebar,
  DashboardV2Topbar,
  type DashboardV2Viewer,
} from "@/components/dashboard-v2/DashboardV2Navigation";
import { DashboardNavigationReady } from "@/components/layout/dashboard/DashboardNavigationReady";
import { DashboardOverlayReady } from "@/components/layout/dashboard/DashboardOverlayReady";

async function getDashboardV2Viewer(): Promise<DashboardV2Viewer> {
  const session = await getCachedServerSession();
  const user = session?.user;
  const displayName =
    user?.name?.trim() ||
    user?.email?.trim().split("@")[0] ||
    "Guest preview";

  return {
    displayName,
    email: user?.email?.trim() ?? null,
    image: user?.image ?? null,
    role: user?.role ?? null,
    subscriptionStatus: user?.subscriptionStatus ?? null,
    isAuthenticated: Boolean(user?.id),
  };
}

export async function DashboardV2Shell({ children }: { children: ReactNode }) {
  const viewer = await getDashboardV2Viewer();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardNavigationReady />
      <DashboardOverlayReady />
      <div className="flex min-h-dvh">
        <DashboardV2Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardV2Topbar viewer={viewer} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
