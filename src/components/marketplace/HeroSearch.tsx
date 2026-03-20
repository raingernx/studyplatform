"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/design-system";

/**
 * Large hero-sized search bar for the Marketplace page.
 * Reads/writes the ?search= URL param; resets to page 1 on every submit.
 */
export function HeroSearch() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get("search") ?? "");

  // Keep the input in sync with the URL (browser back/forward)
  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
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
        variant="hero"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search worksheets, flashcards, notes…"
        onClear={handleClear}
      />
    </form>
  );
}
