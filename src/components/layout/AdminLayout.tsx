"use client";

import type { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { AdminUXProvider } from "@/features/admin-ux/AdminUXProvider";
import { NotificationStack } from "@/components/admin/NotificationStack";
import { CommandPalette } from "@/components/CommandPalette";
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
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        AU
      </div>
      <div className="flex flex-col leading-tight">
        <p className="text-small font-medium text-foreground">Admin access</p>
        <p className="text-caption text-muted-foreground">Administrator</p>
      </div>
    </div>
  );

  return (
    <AdminUXProvider>
      <DashboardShell
        variant={shellVariant}
        sections={getDashboardNav({ area: "admin" })}
        sidebarHeader={
          <p className="font-ui text-small font-medium text-foreground">
            Admin workspace
          </p>
        }
        sidebarFooter={sidebarFooter}
        contentClassName="bg-muted/40"
        mainClassName="py-4 sm:py-5 lg:py-5"
        afterMain={<NotificationStack />}
        renderTopbar={({ onMenuToggle }) => (
          <Topbar
            title="Admin workspace"
            subtitle="Control panel"
            onMenuToggle={onMenuToggle}
          />
        )}
      >
        {children}
      </DashboardShell>
      <CommandPalette />
    </AdminUXProvider>
  );
}
