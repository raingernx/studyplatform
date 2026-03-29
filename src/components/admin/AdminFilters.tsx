"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/design-system";
import { cn } from "@/lib/utils";

/** Simple admin list filters: search + optional status. For resources, users, orders. */
interface AdminFiltersProps {
  searchPlaceholder?: string;
  searchParam?: string;
  className?: string;
}

export function AdminFilters({
  searchPlaceholder = "Search…",
  searchParam = "search",
  className,
}: AdminFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(searchParam) ?? "";

  function updateSearch(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    const v = nextValue.trim();
    if (v) params.set(searchParam, v);
    else params.delete(searchParam);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("min-w-[220px] max-w-sm flex-1", className)}>
      <label
        htmlFor={`admin-filter-${searchParam}`}
        className="mb-1 block font-ui text-caption text-text-muted"
      >
        Search
      </label>
      <SearchInput
        id={`admin-filter-${searchParam}`}
        placeholder={searchPlaceholder}
        value={value}
        onChange={(e) => updateSearch(e.target.value)}
        onClear={() => updateSearch("")}
      />
    </div>
  );
}
