import {
  Activity,
  BarChart,
  FlaskConical,
  Folder,
  LayoutDashboard,
  PenSquare,
  Rocket,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Tag,
  Tags,
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
      { href: routes.adminRecommendationReport, label: "Rec. Experiment", icon: FlaskConical },
      { href: routes.adminCreatorActivation, label: "Creator Activation", icon: Rocket },
      { href: routes.adminRankingDebug, label: "Ranking Debug", icon: SlidersHorizontal },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      { href: routes.adminResources, label: "Resources", icon: Folder },
      { href: routes.adminCategories, label: "Categories", icon: Tag },
      { href: routes.adminTags, label: "Tags", icon: Tags },
      { href: routes.adminReviews, label: "Reviews", icon: Star },
    ],
  },
  {
    id: "creators",
    label: "Creators",
    items: [
      { href: routes.adminCreators, label: "Applications", icon: PenSquare },
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
