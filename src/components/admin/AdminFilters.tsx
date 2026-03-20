"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/design-system";
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const v = e.target.value.trim();
    if (v) params.set(searchParam, v);
    else params.delete(searchParam);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={cn("max-w-xs", className)}>
      <Input
        type="search"
        placeholder={searchPlaceholder}
        value={value}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
}
