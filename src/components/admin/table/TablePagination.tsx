"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  /** Current 1-based page */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items (optional, for "Showing X–Y of Z") */
  totalItems?: number;
  /** Items per page (optional) */
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Optional label for the entity (e.g. "resources") */
  entityLabel?: string;
}

/**
 * Admin table pagination: previous/next and optional page info.
 */
export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  className,
  entityLabel = "items",
}: TablePaginationProps) {
  const from = totalItems != null ? (page - 1) * pageSize + 1 : null;
  const to =
    totalItems != null
      ? Math.min(page * pageSize, totalItems)
      : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-surface-50/60 px-4 py-3 text-sm text-text-secondary",
        className
      )}
    >
      <div>
        {totalItems != null && from != null && to != null && (
          <span>
            Showing {from}–{to} of {totalItems} {entityLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2 text-text-muted">
          Page {page} of {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || totalPages === 0}
          className="rounded-md border border-border-subtle bg-white px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
