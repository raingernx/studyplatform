"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search resources..."
        className="w-full rounded-xl border border-border-subtle bg-white px-11 py-3 text-sm
                   text-text-primary placeholder-text-muted shadow-sm outline-none transition
                   focus:ring-2 focus:ring-brand-500"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400
                     transition-colors hover:text-zinc-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
