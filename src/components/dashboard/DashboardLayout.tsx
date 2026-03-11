import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-surface-50">
      <aside className="border-r border-zinc-100 bg-white">
        <DashboardSidebar />
      </aside>
      <main className="px-8 py-10">{children}</main>
    </div>
  );
}

