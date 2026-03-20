import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { getCreatorAccessState } from "@/services/creator.service";

export const metadata = {
  title: "My Resources",
};

export const dynamic = "force-dynamic";

export default async function DashboardResourcesCompatibilityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/resources");
  }

  const access = await getCreatorAccessState(session.user.id);
  redirect(access.eligible ? routes.creatorResources : routes.creatorApply);
}
