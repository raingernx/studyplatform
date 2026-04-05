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
          "px-4 py-8 text-center",
          className
        )}
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-1.5">
          <p className="text-small font-medium text-foreground">{message}</p>
          {description && (
            <p className="text-small text-muted-foreground">{description}</p>
          )}
          {action && <div className="mt-1.5">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
