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
        "flex flex-wrap items-center gap-3 border-b border-border-subtle bg-white px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
