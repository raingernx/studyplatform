import {
  BarChart2,
  CircleUser,
  FileText,
  LayoutDashboard,
  Plus,
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
      href: routes.dashboardV2CreatorProfile,
      label: "Profile",
      icon: CircleUser,
    },
    {
      href: routes.dashboardV2Creator,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: routes.dashboardV2CreatorResources,
      label: "Resources",
      icon: FileText,
    },
    {
      href: routes.dashboardV2CreatorNewResource,
      label: "New Resource",
      icon: Plus,
    },
    {
      href: routes.dashboardV2CreatorSales,
      label: "Sales",
      icon: ShoppingBag,
    },
    {
      href: routes.dashboardV2CreatorAnalytics,
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
      href: routes.dashboardV2CreatorApply,
      label: "Become a Creator",
      icon: Sparkles,
    },
  ],
};

export const ADMIN_CREATOR_ENTRYPOINT_SECTION: DashboardNavSection = {
  id: "creator-workspace",
  label: "Creator",
  items: [
    {
      href: routes.dashboardV2Creator,
      label: "Creator Workspace",
      icon: Sparkles,
    },
  ],
};
