"use client";

import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardShellVariant } from "./dashboard-nav.types";

interface DashboardTopbarProps {
  variant: DashboardShellVariant;
  left?: ReactNode;
  right?: ReactNode;
  onMenuToggle?: () => void;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

const TOPBAR_HEIGHT_CLASS: Record<DashboardShellVariant, string> = {
  user: "h-14",
  creator: "h-14",
  admin: "h-16",
};

const TOPBAR_BORDER_CLASS: Record<DashboardShellVariant, string> = {
  user: "border-neutral-100",
  creator: "border-neutral-100",
  admin: "border-border-subtle",
};

export function DashboardTopbar({
  variant,
  left,
  right,
  onMenuToggle,
  className,
  leftClassName,
  rightClassName,
}: DashboardTopbarProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-4 bg-white px-8",
        TOPBAR_HEIGHT_CLASS[variant],
        TOPBAR_BORDER_CLASS[variant],
        "border-b",
        className
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3",
          leftClassName
        )}
      >
        {onMenuToggle ? (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
        {left}
      </div>

      {right ? (
        <div className={cn("ml-4 flex shrink-0 items-center", rightClassName)}>
          {right}
        </div>
      ) : null}
    </header>
  );
}
