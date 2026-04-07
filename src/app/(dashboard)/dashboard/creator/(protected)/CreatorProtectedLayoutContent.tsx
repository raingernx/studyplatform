import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import {
  canAccessCreatorWorkspace,
  getCreatorAccessState,
} from "@/services/creator";

interface CreatorProtectedLayoutContentProps {
  children: ReactNode;
}

/**
 * Keep creator workspace auth/access checks behind a creator-scoped Suspense
 * boundary so hard refreshes land on the creator family loading shell instead
 * of bubbling up to a broader app-level fallback.
 */
export default async function CreatorProtectedLayoutContent({
  children,
}: CreatorProtectedLayoutContentProps) {
  const { userId } = await requireSession(routes.creatorDashboard);
  const access = await getCreatorAccessState(userId);

  if (!canAccessCreatorWorkspace(access)) {
    redirect(routes.creatorApply);
  }

  return <>{children}</>;
}
