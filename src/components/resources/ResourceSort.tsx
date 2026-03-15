"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS, normaliseSortParam, type SortValue } from "@/config/sortOptions";

// Re-export for any callers that import SortOption from this file.
export type SortOption = SortValue;

export function ResourceSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mirror the active sort from the URL; normalise legacy values and fall back to "newest".
  const current = normaliseSortParam(searchParams.get("sort"));

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      // "newest" is the default — keep the URL clean by omitting the param
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    // Reset to page 1 after every sort change
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 flex-shrink-0 text-zinc-400" />
      <div className="relative">
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none cursor-pointer rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-9
                     text-sm text-zinc-700 shadow-sm outline-none transition
                     focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          aria-label="Sort resources"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="h-3 w-3 text-zinc-500"
          >
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
