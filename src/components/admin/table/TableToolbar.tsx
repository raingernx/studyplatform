"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Toolbar above the table: search, filters, primary actions.
 * Use flex and gap to lay out search input, filter dropdowns, and buttons.
 */
export function TableToolbar({ children, className }: TableToolbarProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
