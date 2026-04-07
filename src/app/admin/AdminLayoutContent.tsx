import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { routes } from "@/lib/routes";

interface AdminLayoutContentProps {
  children: ReactNode;
}

/**
 * Keep admin auth/session resolution behind an admin-scoped Suspense boundary so
 * hard refreshes land on the admin family loading shell instead of the global
 * app fallback while the session check resolves.
 */
export default async function AdminLayoutContent({
  children,
}: AdminLayoutContentProps) {
  await requireAdminSession(routes.admin);
  return <AdminLayout>{children}</AdminLayout>;
}
