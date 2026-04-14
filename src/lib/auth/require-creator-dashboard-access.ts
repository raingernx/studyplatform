import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { canAccessCreatorWorkspace, getCreatorAccessState } from "@/services/creator";

export async function requireCreatorDashboardAccess(route: string) {
  const sessionState = await requireSession(route);
  const access = await getCreatorAccessState(sessionState.userId);

  const canOpenCreatorFamily =
    sessionState.session.user.role === "ADMIN" ||
    sessionState.session.user.role === "INSTRUCTOR" ||
    canAccessCreatorWorkspace(access);

  if (!canOpenCreatorFamily) {
    redirect(routes.dashboardV2CreatorApply);
  }

  return {
    ...sessionState,
    access,
  };
}
