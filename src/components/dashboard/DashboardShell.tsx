"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, HelpCircle, Sparkles } from "lucide-react";
import { DashboardTopbar } from "./DashboardTopbar";
import type { DashboardUser } from "./DashboardLayout";
import { routes } from "@/lib/routes";
import { getDashboardNav } from "@/lib/dashboard/getDashboardNav";
import { getDashboardShellVariant } from "@/lib/dashboard/dashboard-permissions";
import { DashboardShell as SharedDashboardShell } from "@/components/layout/dashboard/DashboardShell";
import { usePlatformConfig } from "@/components/providers/PlatformConfigProvider";
import { beginDashboardNavigation } from "@/components/layout/dashboard/dashboardNavigationState";

interface DashboardShellProps {
  user: DashboardUser;
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const platform = usePlatformConfig();
  const isSubscribed = user.subscriptionStatus === "ACTIVE";
  const shellVariant = getDashboardShellVariant({
    area: "dashboard",
    role: user.role,
    isCreator: user.isCreator,
  });

  const topSlot = isSubscribed ? (
    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 shadow-sm">
      <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
      <span className="text-[12px] font-semibold text-white">Pro Member</span>
    </div>
  ) : (
    <Link
      href={routes.subscription}
      onClick={() => beginDashboardNavigation(routes.subscription)}
      className="group flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/80 transition-all hover:bg-amber-100 hover:ring-amber-300"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[12px] font-semibold text-amber-700">
          Upgrade to Pro
        </span>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );

  const footer = (
    <a
      href={`mailto:${platform.supportEmail}`}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <HelpCircle className="h-4 w-4" />
      Help &amp; Support
    </a>
  );

  return (
    <SharedDashboardShell
      variant={shellVariant}
      sections={getDashboardNav({
        area: "dashboard",
        role: user.role,
        isCreator: user.isCreator,
      })}
      profile={{
        name: user.name,
        email: user.email,
        image: user.image,
        fallbackName: "Student",
      }}
      sidebarTopSlot={topSlot}
      sidebarFooter={footer}
      renderTopbar={({ onMenuToggle }) => (
        <DashboardTopbar user={user} onMenuToggle={onMenuToggle} />
      )}
    >
      {children}
    </SharedDashboardShell>
  );
}
