import { Suspense, type ReactNode } from "react";

import { CreatorDashboardOverviewLoadingShell } from "@/components/skeletons/CreatorDashboardRouteSkeletons";

import CreatorProtectedLayoutContent from "./CreatorProtectedLayoutContent";

export default function CreatorProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<CreatorDashboardOverviewLoadingShell />}>
      <CreatorProtectedLayoutContent>{children}</CreatorProtectedLayoutContent>
    </Suspense>
  );
}
