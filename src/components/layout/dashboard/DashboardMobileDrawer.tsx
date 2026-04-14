"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardMobileDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function DashboardMobileDrawer({
  isOpen,
  onClose,
  children,
}: DashboardMobileDrawerProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[hsl(var(--card)/0.78)] backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[272px] shadow-2xl transition-transform duration-200 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {children}
      </div>
    </>
  );
}
