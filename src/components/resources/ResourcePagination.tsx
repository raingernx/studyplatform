"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface ResourcePaginationProps {
  page: number;
  totalPages: number;
}

export function ResourcePagination({ page, totalPages }: ResourcePaginationProps) {
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
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium
                   text-zinc-600 transition-colors hover:bg-zinc-50
                   disabled:pointer-events-none disabled:opacity-40"
      >
        ← Prev
      </button>

      {buildPageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-zinc-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => handlePageChange(p as number)}
            className={cn(
              "min-w-[36px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              p === page
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium
                   text-zinc-600 transition-colors hover:bg-zinc-50
                   disabled:pointer-events-none disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Produces page numbers + ellipsis tokens for a compact pagination bar. */
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
