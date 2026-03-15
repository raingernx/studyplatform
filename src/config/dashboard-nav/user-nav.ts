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
        href: routes.dashboard,
        label: "Home",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: routes.library,
        label: "Library",
        icon: BookOpen,
      },
      {
        href: routes.downloads,
        label: "Downloads",
        icon: Download,
      },
      {
        href: routes.purchases,
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
        href: routes.subscription,
        label: "Membership",
        icon: CreditCard,
      },
      {
        href: routes.settings,
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

