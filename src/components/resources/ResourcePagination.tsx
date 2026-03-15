"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourcePaginationProps {
  page: number;
  totalPages: number;
  /** Optional ref to scroll results grid into view on page change */
  gridContainerRef?: React.RefObject<HTMLElement | null>;
}

export function ResourcePagination({ page, totalPages, gridContainerRef }: ResourcePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    gridContainerRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-8"
    >
      {/* Prev */}
      <PaginationButton
        onClick={() => handlePageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </PaginationButton>

      {/* Page numbers */}
      {buildPageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="select-none px-1 text-sm text-text-muted">
            …
          </span>
        ) : (
          <PaginationButton
            key={p}
            onClick={() => handlePageChange(p as number)}
            active={p === page}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </PaginationButton>
        )
      )}

      {/* Next */}
      <PaginationButton
        onClick={() => handlePageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>
    </nav>
  );
}

// ── PaginationButton ──────────────────────────────────────────────────────────

function PaginationButton({
  children,
  onClick,
  disabled = false,
  active   = false,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={cn(
        "inline-flex min-w-[36px] items-center justify-center gap-1 rounded-lg border px-3 py-2",
        "text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-surface-200 bg-white text-text-secondary hover:border-brand-300 hover:text-brand-600",
      )}
    >
      {children}
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
