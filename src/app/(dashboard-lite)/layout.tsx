import { Suspense, type ReactNode } from "react";

import { DashboardGroupNavigationOverlay } from "@/components/providers/DashboardGroupNavigationOverlay";
import { DashboardGroupLoadingShell } from "@/components/skeletons/DashboardGroupLoadingShell";

import DashboardSessionLayoutContent from "./DashboardSessionLayoutContent";

export const dynamic = "force-dynamic";

interface DashboardLiteLayoutProps {
  children: ReactNode;
}

export default function DashboardLiteLayout({
  children,
}: DashboardLiteLayoutProps) {
  return (
    <>
      <DashboardGroupNavigationOverlay />
      <Suspense fallback={<DashboardGroupLoadingShell />}>
        <DashboardSessionLayoutContent>{children}</DashboardSessionLayoutContent>
      </Suspense>
    </>
  );
}
