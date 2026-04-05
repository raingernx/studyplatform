"use client";

import Link from "next/link";
import { SidebarBadge } from "@/design-system";
import type { DashboardNavItem } from "./dashboard-nav.types";
import { cn } from "@/lib/utils";
import { beginDashboardNavigation } from "./dashboardNavigationState";

interface DashboardSidebarItemProps {
  item: DashboardNavItem;
  active: boolean;
  onNavigate?: () => void;
}

export function DashboardSidebarItem({
  item,
  active,
  onNavigate,
}: DashboardSidebarItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => {
        beginDashboardNavigation(item.href);
        onNavigate?.();
      }}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium leading-5 transition-colors",
        active
          ? "bg-accent font-semibold text-foreground shadow-none hover:bg-accent hover:text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="flex w-full min-w-0 items-center gap-2">
        <span className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 opacity-80 transition-colors",
                  active
                    ? "text-primary-700 opacity-100"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
            </span>
          ) : null}
          <span className="truncate">{item.label}</span>
        </span>
        {item.badge ? (
          <SidebarBadge
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              active
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {item.badge}
          </SidebarBadge>
        ) : null}
      </span>
    </Link>
  );
}
