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
  admin: "h-14",
};

const TOPBAR_BORDER_CLASS: Record<DashboardShellVariant, string> = {
  user: "border-border",
  creator: "border-border",
  admin: "border-border",
};

const TOPBAR_SURFACE_CLASS: Record<DashboardShellVariant, string> = {
  user: "sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80",
  creator:
    "sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80",
  admin:
    "sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90",
};

const TOPBAR_PADDING_CLASS: Record<DashboardShellVariant, string> = {
  user: "px-4 sm:px-6 lg:px-8",
  creator: "px-4 sm:px-6 lg:px-8",
  admin: "px-4 sm:px-6 lg:px-8",
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
        "flex shrink-0 items-center justify-between gap-4",
        TOPBAR_HEIGHT_CLASS[variant],
        TOPBAR_BORDER_CLASS[variant],
        TOPBAR_SURFACE_CLASS[variant],
        TOPBAR_PADDING_CLASS[variant],
        "border-b",
        className
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5",
          leftClassName
        )}
      >
        {onMenuToggle ? (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
        {left}
      </div>

      {right ? (
        <div className={cn("ml-3 flex shrink-0 items-center", rightClassName)}>
          {right}
        </div>
      ) : null}
    </header>
  );
}
