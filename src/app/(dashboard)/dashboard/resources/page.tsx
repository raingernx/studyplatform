import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { canAccessCreatorWorkspace, getCreatorAccessState } from "@/services/creator";

export const metadata = {
  title: "My Resources",
};

export const dynamic = "force-dynamic";

export default async function DashboardResourcesCompatibilityPage() {
  const { userId, session } = await requireSession(routes.dashboardResources);

  if (session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") {
    redirect(routes.creatorResources);
  }

  const access = await getCreatorAccessState(userId);
  redirect(canAccessCreatorWorkspace(access) ? routes.creatorResources : routes.creatorApply);
}
