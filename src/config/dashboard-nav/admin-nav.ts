import {
  Activity,
  BarChart,
  Folder,
  LayoutDashboard,
  Megaphone,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Users,
} from "lucide-react";
import type { DashboardNavSection } from "@/components/layout/dashboard/dashboard-nav.types";
import { routes } from "@/lib/routes";

export const ADMIN_DASHBOARD_NAV_SECTIONS: DashboardNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: routes.admin, label: "Dashboard", icon: LayoutDashboard, exact: true },
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
      { href: routes.adminUsers, label: "Users", icon: Users },
      { href: routes.adminOrders, label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { href: routes.adminHeroes, label: "Heroes", icon: Megaphone },
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
