import {
  BookOpen,
  CreditCard,
  Download,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";
import type { DashboardNavSection } from "@/components/layout/dashboard/dashboard-nav.types";
import { routes } from "@/lib/routes";

export const USER_DASHBOARD_NAV_SECTIONS: DashboardNavSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [
      {
        href: routes.dashboardV2,
        label: "Home",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: routes.dashboardV2Library,
        label: "Library",
        icon: BookOpen,
      },
      {
        href: routes.dashboardV2Downloads,
        label: "Downloads",
        icon: Download,
      },
      {
        href: routes.dashboardV2Purchases,
        label: "Purchases",
        icon: ShoppingBag,
      },
    ],
  },
  {
    id: "explore",
    label: "Explore",
    items: [
      {
        href: routes.marketplace,
        label: "Marketplace",
        icon: Store,
        exact: true,
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        href: routes.dashboardV2Membership,
        label: "Membership",
        icon: CreditCard,
      },
      {
        href: routes.dashboardV2Settings,
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];
