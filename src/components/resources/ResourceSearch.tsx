"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/design-system";

export function ResourceSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mirror the current ?search= value so the input stays in sync on navigation
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    // Reset to page 1 whenever the search term changes
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <SearchInput
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search resources..."
        onClear={handleClear}
      />
    </form>
  );
}
