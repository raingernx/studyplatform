"use client";

import Link from "next/link";
import type { DashboardNavItem } from "./dashboard-nav.types";
import { cn } from "@/lib/utils";
import { SidebarBadge } from "@/components/ui/sidebar";

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
      onClick={onNavigate}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium leading-5 transition-colors",
        "text-muted-foreground hover:bg-neutral-50 hover:text-foreground",
        active && "bg-slate-900 font-semibold text-white shadow-sm",
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
                  active ? "text-white" : "text-neutral-400 group-hover:text-neutral-600"
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
                ? "bg-white/12 text-white"
                : "bg-neutral-100 text-neutral-500"
            )}
          >
            {item.badge}
          </SidebarBadge>
        ) : null}
      </span>
    </Link>
  );
}
