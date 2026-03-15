import type {
  DashboardNavSection,
} from "@/components/layout/dashboard/dashboard-nav.types";
import {
  CREATOR_APPLY_NAV_SECTION,
  CREATOR_DASHBOARD_NAV_SECTION,
} from "@/config/dashboard-nav/creator-nav";
import { ADMIN_DASHBOARD_NAV_SECTIONS } from "@/config/dashboard-nav/admin-nav";
import { USER_DASHBOARD_NAV_SECTIONS } from "@/config/dashboard-nav/user-nav";
import {
  resolveDashboardNavState,
  type DashboardNavContext,
} from "./dashboard-permissions";

export function getDashboardNav({
  area,
  role,
  isCreator,
}: DashboardNavContext): DashboardNavSection[] {
  const { shellVariant, creatorNavMode } = resolveDashboardNavState({
    area,
    role,
    isCreator,
  });

  if (shellVariant === "admin") {
    return ADMIN_DASHBOARD_NAV_SECTIONS;
  }

  const baseSections = [...USER_DASHBOARD_NAV_SECTIONS];

  if (creatorNavMode === "hidden") {
    return baseSections;
  }

  const creatorSection =
    creatorNavMode === "full"
      ? CREATOR_DASHBOARD_NAV_SECTION
      : CREATOR_APPLY_NAV_SECTION;

  return [
    baseSections[0],
    creatorSection,
    ...baseSections.slice(1),
  ];
}
