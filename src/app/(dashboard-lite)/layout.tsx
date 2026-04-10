import type { ReactNode } from "react";

import { DashboardGroupNavigationOverlay } from "@/components/providers/DashboardGroupNavigationOverlay";

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
      <DashboardSessionLayoutContent>{children}</DashboardSessionLayoutContent>
    </>
  );
}
