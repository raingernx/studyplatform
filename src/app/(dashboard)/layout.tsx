import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface DashboardGroupLayoutProps {
  children: ReactNode;
}

export default function DashboardGroupLayout({ children }: DashboardGroupLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
}

