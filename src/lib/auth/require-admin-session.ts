import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth";
import { routes } from "@/lib/routes";

export async function requireAdminSession(nextPath: string) {
  const session = await getCachedServerSession();

  if (!session?.user?.id) {
    redirect(routes.loginWithNext(nextPath));
  }

  if (session.user.role !== "ADMIN") {
    redirect(routes.dashboardV2);
  }

  return session;
}
