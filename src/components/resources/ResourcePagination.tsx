"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildPaginationItems,
  PaginationButton,
  PaginationEllipsis,
  PaginationList,
  PaginationNav,
} from "@/design-system";

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
    <PaginationNav className="gap-1 pt-8">
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
      <PaginationList>
        {buildPaginationItems(page, totalPages).map((p, i) =>
          p === "…" ? (
            <PaginationEllipsis key={`ellipsis-${i}`} />
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
      </PaginationList>

      {/* Next */}
      <PaginationButton
        onClick={() => handlePageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>
    </PaginationNav>
  );
}
