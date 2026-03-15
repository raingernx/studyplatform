"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableEmptyStateProps {
  /** Short message (e.g. "No resources yet") */
  message: string;
  /** Optional longer description */
  description?: React.ReactNode;
  /** Optional CTA (e.g. "Create resource" button) */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Shown when the table has no rows. Centered message, optional description and action.
 */
export function TableEmptyState({
  message,
  description,
  action,
  className,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td
        colSpan={100}
        className={cn(
          "px-4 py-12 text-center",
          className
        )}
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{message}</p>
          {description && (
            <p className="text-sm text-text-muted">{description}</p>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
