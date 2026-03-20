"use client";

import type { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { AdminUXProvider } from "@/features/admin-ux/AdminUXProvider";
import { NotificationStack } from "@/components/admin/NotificationStack";
import { CommandPalette } from "@/components/CommandPalette";
import { PageContentWide } from "@/design-system";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";
import { getDashboardNav } from "@/lib/dashboard/getDashboardNav";
import { getDashboardShellVariant } from "@/lib/dashboard/dashboard-permissions";

interface AdminLayoutProps {
  children: ReactNode;
}

/** Admin layout: Sidebar + Topbar + content. */
export function AdminLayout({ children }: AdminLayoutProps) {
  const shellVariant = getDashboardShellVariant({ area: "admin" });

  const sidebarFooter = (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
        AU
      </div>
      <div className="flex flex-col leading-tight">
        <p className="text-sm font-semibold text-foreground">Admin User</p>
        <p className="text-xs text-muted-foreground">Administrator</p>
      </div>
    </div>
  );

  return (
    <AdminUXProvider>
      <DashboardShell
        variant={shellVariant}
        sections={getDashboardNav({ area: "admin" })}
        sidebarHeader={
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
            Admin
          </p>
        }
        sidebarFooter={sidebarFooter}
        contentClassName="bg-muted-50"
        afterMain={<NotificationStack />}
        renderTopbar={({ onMenuToggle }) => (
          <Topbar
            title="Admin"
            subtitle="Control panel"
            onMenuToggle={onMenuToggle}
          />
        )}
      >
        <PageContentWide>{children}</PageContentWide>
      </DashboardShell>
      <CommandPalette />
    </AdminUXProvider>
  );
}
