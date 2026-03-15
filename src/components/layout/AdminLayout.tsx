"use client";

import type { ReactNode } from "react";
import { Sidebar, type SidebarSection } from "./Sidebar";
import {
  Activity,
  BarChart,
  Folder,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Users as UsersIcon,
} from "lucide-react";
import { Topbar } from "./Topbar";
import { routes } from "@/lib/routes";
import { AdminUXProvider } from "@/features/admin-ux/AdminUXProvider";
import { NotificationStack } from "@/components/admin/NotificationStack";
import { CommandPalette } from "@/components/CommandPalette";

const ADMIN_NAV_SECTIONS: SidebarSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: routes.admin, label: "Dashboard", icon: LayoutDashboard },
      { href: routes.adminAnalytics, label: "Analytics", icon: BarChart },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { href: routes.adminResources, label: "Resources", icon: Folder },
      { href: routes.adminCategories, label: "Categories", icon: Tag },
      { href: routes.adminReviews, label: "Reviews", icon: Star },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { href: routes.adminUsers, label: "Users", icon: UsersIcon },
      { href: routes.adminOrders, label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { href: routes.adminActivity, label: "Activity", icon: Activity },
      { href: routes.adminAudit, label: "Audit Trail", icon: ShieldCheck },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: routes.adminSettings, label: "Settings", icon: SettingsIcon },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

/** Admin layout: Sidebar + Topbar + content. */
export function AdminLayout({ children }: AdminLayoutProps) {
  const sidebarFooter = (
    <div className="flex items-center gap-3 border-t border-gray-200 px-4 py-3">
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
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar
          title="Admin"
          sections={ADMIN_NAV_SECTIONS}
          footer={sidebarFooter}
        />
        <div className="flex min-h-screen flex-1 flex-col bg-muted-50">
          <Topbar title="Admin" subtitle="Control panel" />
          <main className="flex-1 px-8 py-8">{children}</main>
          <NotificationStack />
        </div>
      </div>
      <CommandPalette />
    </AdminUXProvider>
  );
}
