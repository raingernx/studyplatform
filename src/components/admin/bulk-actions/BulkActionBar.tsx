"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BulkActionBarProps {
  /** Number of selected rows */
  selectedCount: number;
  /** Singular label (e.g. "resource") for "3 resources selected" */
  entityLabel?: string;
  /** Action buttons or custom content (e.g. Publish, Archive, Delete) */
  children: React.ReactNode;
  className?: string;
}

/**
 * Bar shown when table rows are selected. Displays count and action buttons.
 * Place above the table or between toolbar and table.
 */
export function BulkActionBar({
  selectedCount,
  entityLabel = "item",
  children,
  className,
}: BulkActionBarProps) {
  const label =
    selectedCount === 1
      ? `1 ${entityLabel} selected`
      : `${selectedCount} ${entityLabel}s selected`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border-subtle bg-surface-50 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        className
      )}
    >
      <div className="font-medium text-text-secondary">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
