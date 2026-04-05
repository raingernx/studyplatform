"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import {
  SidebarContainer,
  SidebarNav,
} from "@/design-system";
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

  const resolvedHeader = header ?? <Logo variant="full" size="md" />;
  const isDashboardVariant = variant !== "admin";

  const content = (
    <SidebarContainer
      className={cn(
        "h-full shrink-0",
        isDashboardVariant &&
          "[&_a[aria-current='page']]:!bg-accent [&_a[aria-current='page']]:!text-foreground [&_a[aria-current='page']]:!shadow-none [&_a[aria-current='page']]:!font-semibold [&_a[aria-current='page']_svg]:!text-primary-700 [&_a[aria-current='page']_span.ml-auto]:!bg-secondary [&_a[aria-current='page']_span.ml-auto]:!text-secondary-foreground",
        variant === "admin" &&
          "[&_a]:min-h-10 [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:text-muted-foreground [&_a:hover]:bg-accent [&_a:hover]:text-foreground [&_a_svg]:text-muted-foreground [&_a[aria-current='page']]:!bg-accent [&_a[aria-current='page']]:!text-foreground [&_a[aria-current='page']]:!shadow-none [&_a[aria-current='page']]:!font-semibold [&_a[aria-current='page']_svg]:!text-primary-700 [&_a[aria-current='page']_span.ml-auto]:!bg-secondary [&_a[aria-current='page']_span.ml-auto]:!text-secondary-foreground"
      )}
    >
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-5 lg:px-6">
        {resolvedHeader}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground lg:hidden"
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

      {topSlot ? (
        <div className="flex-shrink-0 px-4 pt-4 lg:px-5">{topSlot}</div>
      ) : null}

      <SidebarNav
        className={cn(
          "pt-4",
          isDashboardVariant &&
            "[&_p]:tracking-[0.08em] [&_p]:text-muted-foreground [&_ul]:space-y-1",
          variant === "admin" &&
            "pt-5 [&_p]:mb-2 [&_p]:mt-0 [&_p]:px-2 [&_p]:font-ui [&_p]:text-caption [&_p]:tracking-[0.08em] [&_p]:text-muted-foreground [&_ul]:space-y-1"
        )}
      >
        {sections.map((section, index) => (
          <DashboardSidebarSection
            key={section.id}
            section={section}
            activeMatcher={isActive}
            onNavigate={onClose}
            className={cn(index > 0 && "mt-6")}
          />
        ))}
      </SidebarNav>

      {footer ? (
        <div className="mt-auto flex-shrink-0 border-t border-border-subtle px-5 py-4">
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
