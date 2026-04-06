"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/design-system";
import type {
  DashboardNavSection,
  DashboardShellVariant,
} from "./dashboard-nav.types";
import { DashboardNavigationFeedback } from "./DashboardNavigationFeedback";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardShellProfile {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  fallbackName?: string;
}

interface DashboardShellControls {
  onMenuToggle: () => void;
}

interface DashboardShellProps {
  variant: DashboardShellVariant;
  sections: DashboardNavSection[];
  children: ReactNode;
  profile?: DashboardShellProfile;
  sidebarHeader?: ReactNode;
  sidebarTopSlot?: ReactNode;
  sidebarFooter?: ReactNode;
  renderTopbar: (controls: DashboardShellControls) => ReactNode;
  contentClassName?: string;
  mainClassName?: string;
  afterMain?: ReactNode;
}

export function DashboardShell({
  variant,
  sections,
  children,
  profile,
  sidebarHeader,
  sidebarTopSlot,
  sidebarFooter,
  renderTopbar,
  contentClassName,
  mainClassName,
  afterMain,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div data-route-shell-ready="dashboard" className="flex min-h-screen bg-background">
      <DashboardNavigationFeedback />
      <DashboardSidebar
        variant={variant}
        sections={sections}
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        header={sidebarHeader}
        topSlot={sidebarTopSlot}
        footer={sidebarFooter}
      />

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden",
          contentClassName
        )}
      >
        {renderTopbar({
          onMenuToggle: () => setSidebarOpen((open) => !open),
        })}
        <main
          className={cn(
            "flex-1 min-w-0 overflow-y-auto py-4 sm:py-5 lg:py-6",
            mainClassName
          )}
        >
          <Container>{children}</Container>
        </main>
        {afterMain}
      </div>
    </div>
  );
}
