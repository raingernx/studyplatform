import type { DashboardShellVariant } from "@/components/layout/dashboard/dashboard-nav.types";

export type DashboardNavArea = "dashboard" | "admin";
export type DashboardUserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT" | null | undefined;
export type DashboardCreatorNavMode = "hidden" | "apply" | "full";

export interface DashboardNavContext {
  area: DashboardNavArea;
  role?: DashboardUserRole;
  isCreator?: boolean;
}

interface ResolvedDashboardNavState {
  shellVariant: DashboardShellVariant;
  creatorNavMode: DashboardCreatorNavMode;
}

export function resolveDashboardNavState({
  area,
  role,
  isCreator = false,
}: DashboardNavContext): ResolvedDashboardNavState {
  if (area === "admin") {
    return {
      shellVariant: "admin",
      creatorNavMode: "hidden",
    };
  }

  if (isCreator) {
    return {
      shellVariant: "creator",
      creatorNavMode: "full",
    };
  }

  if (role === "ADMIN") {
    return {
      shellVariant: "user",
      creatorNavMode: "hidden",
    };
  }

  return {
    shellVariant: "user",
    creatorNavMode: "apply",
  };
}

export function getDashboardShellVariant(context: DashboardNavContext) {
  return resolveDashboardNavState(context).shellVariant;
}
