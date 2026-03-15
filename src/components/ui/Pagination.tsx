"use client";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-4 text-xs text-text-secondary", className)}
    >
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => canPrev && onPageChange(page - 1)}
        className={cn(
          "rounded-full px-3 py-1.5 border border-surface-200",
          "hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => canNext && onPageChange(page + 1)}
        className={cn(
          "rounded-full px-3 py-1.5 border border-surface-200",
          "hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        Next
      </button>
    </nav>
  );
}

