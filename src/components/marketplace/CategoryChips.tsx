"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ChipCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Discover — removes the category param and navigates to the current
 * current path.
 * is present. Never treat category=all as Discover.
 */
export function DiscoverButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const isDiscover = category === null;

  // Build discover URL: current path, all params except category
  const discoverUrl = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();

  return (
    <Link
      href={discoverUrl}
      scroll={false}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition sm:px-4",
        isDiscover
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      )}
      aria-label="Discover resources"
    >
      Discover
    </Link>
  );
}

interface CategoryChipsProps {
  categories: ChipCategory[];
}

/**
 * Category filter chips. Links stay on the current path
 * 
 * are never needed and searchParams always reach the server component.
 */
export function CategoryChips({ categories }: CategoryChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const isAll = category === "all";

  /** Build a URL on the current path with only the category param swapped. */
  function chipUrl(slug: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", slug);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div
      role="navigation"
      aria-label="Filter by category"
      className="flex shrink-0 items-center gap-2 pr-3"
    >
      <Chip label="All" href={chipUrl("all")} active={isAll} />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          label={cat.name}
          href={chipUrl(cat.slug)}
          active={category === cat.slug}
        />
      ))}
    </div>
  );
}

/* ── Chip ────────────────────────────────────────────────────────────────── */

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      )}
    >
      {label}
    </Link>
  );
}
