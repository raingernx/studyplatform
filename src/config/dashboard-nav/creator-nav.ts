import {
  BarChart2,
  CircleUser,
  FileText,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { DashboardNavSection } from "@/components/layout/dashboard/dashboard-nav.types";
import { routes } from "@/lib/routes";

export const CREATOR_DASHBOARD_NAV_SECTION: DashboardNavSection = {
  id: "creator",
  label: "Creator",
  items: [
    {
      href: routes.creatorProfile,
      label: "Profile",
      icon: CircleUser,
    },
    {
      href: routes.creatorDashboard,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: routes.creatorResources,
      label: "Resources",
      icon: FileText,
    },
    {
      href: routes.creatorSales,
      label: "Sales",
      icon: ShoppingBag,
    },
    {
      href: routes.creatorAnalytics,
      label: "Analytics",
      icon: BarChart2,
    },
  ],
};

export const CREATOR_APPLY_NAV_SECTION: DashboardNavSection = {
  id: "creator",
  label: "Creator",
  items: [
    {
      href: routes.creatorApply,
      label: "Become a Creator",
      icon: Sparkles,
    },
  ],
};

