import type { ReactNode } from "react";

import { DashboardNavigationReady } from "@/components/layout/dashboard/DashboardNavigationReady";

export default function DashboardLiteTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DashboardNavigationReady />
      {children}
    </>
  );
}
