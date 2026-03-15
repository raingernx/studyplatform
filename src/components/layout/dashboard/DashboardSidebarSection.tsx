"use client";

import { SidebarSection, SidebarSectionLabel } from "@/components/ui/sidebar";
import type { DashboardNavSection } from "./dashboard-nav.types";
import { DashboardSidebarItem } from "./DashboardSidebarItem";
import { cn } from "@/lib/utils";

interface DashboardSidebarSectionProps {
  section: DashboardNavSection;
  activeMatcher: (href: string, exact?: boolean) => boolean;
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebarSection({
  section,
  activeMatcher,
  onNavigate,
  className,
}: DashboardSidebarSectionProps) {
  return (
    <SidebarSection className={className}>
      <SidebarSectionLabel className="mb-2.5 mt-0 px-2">
        {section.label}
      </SidebarSectionLabel>
      <ul className="space-y-1.5">
        {section.items.map((item) => (
          <li key={item.href}>
            <DashboardSidebarItem
              item={item}
              active={activeMatcher(item.href, item.exact)}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </SidebarSection>
  );
}
