"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  SidebarContainer,
  SidebarNav,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type {
  DashboardNavSection,
  DashboardShellVariant,
} from "./dashboard-nav.types";
import { DashboardSidebarProfile } from "./DashboardSidebarProfile";
import { DashboardSidebarSection } from "./DashboardSidebarSection";
import { DashboardMobileDrawer } from "./DashboardMobileDrawer";

interface SidebarProfileData {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  fallbackName?: string;
}

interface DashboardSidebarProps {
  variant: DashboardShellVariant;
  sections: DashboardNavSection[];
  profile?: SidebarProfileData;
  isOpen?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  topSlot?: ReactNode;
  footer?: ReactNode;
}

export function DashboardSidebar({
  variant,
  sections,
  profile,
  isOpen = false,
  onClose,
  header,
  topSlot,
  footer,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(th|en)(?=\/|$)/, "");

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return normalizedPath === href;
    return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
  };

  const resolvedHeader = header ?? <Logo variant="full" size="sidebar" />;

  const content = (
    <SidebarContainer className="h-full shrink-0">
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-100 px-6">
        {resolvedHeader}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {profile ? (
        <DashboardSidebarProfile
          name={profile.name}
          email={profile.email}
          image={profile.image}
          fallbackName={profile.fallbackName}
        />
      ) : null}

      {topSlot ? <div className="flex-shrink-0 px-5 pt-4">{topSlot}</div> : null}

      <SidebarNav className={cn("pt-4", variant === "admin" && "pt-5")}>
        {sections.map((section, index) => (
          <DashboardSidebarSection
            key={section.id}
            section={section}
            activeMatcher={isActive}
            onNavigate={onClose}
            className={cn(index > 0 && "mt-7")}
          />
        ))}
      </SidebarNav>

      {footer ? (
        <div className="mt-auto flex-shrink-0 border-t border-neutral-100 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </SidebarContainer>
  );

  return (
    <>
      <div className="hidden shrink-0 lg:block">{content}</div>
      <DashboardMobileDrawer isOpen={isOpen} onClose={onClose}>
        {content}
      </DashboardMobileDrawer>
    </>
  );
}
