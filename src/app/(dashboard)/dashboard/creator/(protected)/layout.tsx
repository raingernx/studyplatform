import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { canAccessCreatorWorkspace, getCreatorAccessState } from "@/services/creator.service";
import { routes } from "@/lib/routes";

export default async function CreatorProtectedLayout({ children }: { children: ReactNode }) {
  const { userId } = await requireSession("/dashboard/creator");
  const access = await getCreatorAccessState(userId);
  if (!canAccessCreatorWorkspace(access)) {
    redirect(routes.creatorApply);
  }
  return <>{children}</>;
}
