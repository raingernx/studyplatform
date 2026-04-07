import { Suspense, type ReactNode } from "react";

import { AdminDashboardLoadingShell } from "@/components/skeletons/AdminCoreRouteSkeletons";

import AdminLayoutContent from "./AdminLayoutContent";

interface LayoutProps {
  children: ReactNode;
}

export default function AdminLayoutRoute({ children }: LayoutProps) {
  return (
    <Suspense fallback={<AdminDashboardLoadingShell />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
