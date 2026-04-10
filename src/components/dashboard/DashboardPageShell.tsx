"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import {
  CONTAINER_BASE_CLASS_NAME,
  PAGE_CONTENT_MAX_WIDTH_CLASS_NAME,
  PAGE_CONTENT_NARROW_MAX_WIDTH_CLASS_NAME,
} from "@/design-system/layout/Container";
import { cn } from "@/lib/utils";

export const DASHBOARD_PAGE_STACK_CLASS_NAME = "min-w-0 space-y-8";

type DashboardPageShellWidth = "default" | "narrow";

interface DashboardPageShellProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  routeReady?: string;
  width?: DashboardPageShellWidth;
}

interface DashboardPageStackProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

function DashboardShellWidth({
  children,
  className,
  width = "default",
  ...props
}: Omit<DashboardPageShellProps, "routeReady">) {
  return (
    <div
      {...props}
      className={cn(
        CONTAINER_BASE_CLASS_NAME,
        width === "narrow"
          ? PAGE_CONTENT_NARROW_MAX_WIDTH_CLASS_NAME
          : PAGE_CONTENT_MAX_WIDTH_CLASS_NAME,
        DASHBOARD_PAGE_STACK_CLASS_NAME,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardPageShell({
  children,
  routeReady,
  width = "default",
  ...props
}: DashboardPageShellProps) {
  return (
    <DashboardShellWidth
      {...props}
      width={width}
      data-route-shell-ready={routeReady}
    >
      {children}
    </DashboardShellWidth>
  );
}

export function DashboardPageStack({
  children,
  className,
  ...props
}: DashboardPageStackProps) {
  return (
    <div {...props} className={cn(DASHBOARD_PAGE_STACK_CLASS_NAME, className)}>
      {children}
    </div>
  );
}

export function DashboardPageSkeletonShell({
  children,
  width = "default",
  ...props
}: Omit<DashboardPageShellProps, "routeReady">) {
  return (
    <DashboardShellWidth {...props} width={width}>
      {children}
    </DashboardShellWidth>
  );
}
