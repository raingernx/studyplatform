import type { ReactNode } from "react";

import { DashboardGroupNavigationOverlay } from "@/components/providers/DashboardGroupNavigationOverlay";

import DashboardGroupLayoutContent from "./DashboardGroupLayoutContent";

export const dynamic = "force-dynamic";

interface DashboardGroupLayoutProps {
  children: ReactNode;
}

export default function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  return (
    <>
      <DashboardGroupNavigationOverlay />
      <DashboardGroupLayoutContent>{children}</DashboardGroupLayoutContent>
    </>
  );
}
