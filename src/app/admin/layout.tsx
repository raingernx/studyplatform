import type { ReactNode } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface LayoutProps {
  children: ReactNode;
}

export default function AdminLayoutRoute({ children }: LayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
