"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  SidebarBadge,
  SidebarContainer,
  SidebarNav,
  SidebarSection,
  SidebarSectionLabel,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  href: string;
  label: string;
  badgeCount?: number;
  icon?: ComponentType<{ className?: string }>;
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

interface SidebarProps {
  title?: string;
  items?: SidebarItem[];
  sections?: SidebarSection[];
  footer?: ReactNode;
  className?: string;
  collapsed?: boolean;
}

/** Reusable sidebar: nav links + optional title and footer. Used by AdminLayout. */
export function Sidebar({
  title = "Menu",
  items,
  sections,
  footer,
  className,
  collapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(th|en)(?=\/|$)/, "");

  return (
    <SidebarContainer collapsed={collapsed} className={className}>
      <SidebarNav>
        {title && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
              {title}
            </p>
          </div>
        )}

        {sections && sections.length > 0 ? (
          <>
            {sections.map((section, index) => (
              <SidebarSection key={section.id}>
                <SidebarSectionLabel
                  className={cn(index === 0 ? "mt-2" : "mt-8")}
                >
                  {section.label}
                </SidebarSectionLabel>
                <nav className="flex flex-col gap-[2px] text-[13px]">
                  {section.items.map((item) => {
                    const isDashboardRoot = item.href === "/admin";
                    const active = isDashboardRoot
                      ? normalizedPath === "/admin"
                      : normalizedPath === item.href ||
                        normalizedPath.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted hover:text-foreground",
                          active
                            ? "bg-muted font-semibold text-foreground"
                            : "text-muted-foreground"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="flex w-full items-center gap-2">
                          <span className="flex items-center gap-3">
                            {Icon && (
                              <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                            )}
                            <span>{item.label}</span>
                          </span>
                          {typeof item.badgeCount === "number" &&
                            item.badgeCount > 0 && (
                              <SidebarBadge>
                                {item.badgeCount}
                              </SidebarBadge>
                            )}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </SidebarSection>
            ))}
          </>
        ) : (
          <nav className="flex flex-col gap-[2px] text-[13px]">
            {(items ?? []).map((item) => {
              const isDashboardRoot = item.href === "/admin";
              const active = isDashboardRoot
                ? normalizedPath === "/admin"
                : normalizedPath === item.href ||
                  normalizedPath.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted hover:text-foreground",
                    active
                      ? "bg-muted font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex w-full items-center gap-2">
                    <span className="flex items-center gap-3">
                      {Icon && (
                        <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                      )}
                      <span>{item.label}</span>
                    </span>
                    {typeof item.badgeCount === "number" &&
                      item.badgeCount > 0 && (
                        <SidebarBadge>{item.badgeCount}</SidebarBadge>
                      )}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </SidebarNav>
      {footer && <div className="px-3 py-4 text-xs text-text-muted">{footer}</div>}
    </SidebarContainer>
  );
}
