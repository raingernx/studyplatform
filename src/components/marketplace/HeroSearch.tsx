"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/design-system";
import { cn } from "@/lib/utils";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";

type HeroSearchVariant = "hero" | "listing";

interface HeroSearchProps {
  variant?: HeroSearchVariant;
  className?: string;
  placeholder?: string;
}

/**
 * Large hero-sized search bar for the Marketplace page.
 * Reads/writes the ?search= URL param; resets to page 1 on every submit.
 * Uses useTransition so the form shows a pending state immediately while
 * the route is loading — eliminates the frozen-click feeling on submit.
 */
export function HeroSearch({
  variant = "hero",
  className,
  placeholder = "Search worksheets, flashcards, notes…",
}: HeroSearchProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [value, setValue] = useState(searchParams.get("search") ?? "");

  // Keep the input in sync with the URL (browser back/forward)
  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function getNavigationMode(params: URLSearchParams) {
    return params.get("category") || params.get("search") ? "listing" : "discover";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    const href = `${pathname}?${params.toString()}`;
    beginResourcesNavigation(getNavigationMode(params), href);
    startTransition(() => {
      router.push(href);
    });
  }

  function handleClear() {
    if (isPending) return;
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    const href = `${pathname}?${params.toString()}`;
    beginResourcesNavigation(getNavigationMode(params), href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      aria-busy={isPending}
    >
      <SearchInput
        variant={variant === "hero" ? "hero" : "default"}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        onClear={handleClear}
        disabled={isPending}
        className={cn(
          variant === "listing" &&
            "h-11 sm:h-10 rounded-xl sm:rounded-2xl border-surface-200 bg-white py-2 pl-10 pr-10 text-small shadow-sm sm:pl-11 sm:pr-11",
          className,
        )}
      />
    </form>
  );
}
