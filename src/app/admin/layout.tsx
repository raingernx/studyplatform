import { Suspense, type ReactNode } from "react";

import { AdminDashboardLoadingShell } from "@/components/skeletons/AdminCoreRouteSkeletons";

import AdminLayoutContent from "./AdminLayoutContent";

export const dynamic = "force-dynamic";

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
