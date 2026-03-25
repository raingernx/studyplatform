"use client";

import { startTransition, useState, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";

const CATEGORY_CHIP_PREFETCH_LIMIT = 6;
const prefetchedCategoryChipHrefs = new Set<string>();

function prefetchCategoryChipHref(
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  if (prefetchedCategoryChipHrefs.has(href)) {
    return;
  }

  if (prefetchedCategoryChipHrefs.size >= CATEGORY_CHIP_PREFETCH_LIMIT) {
    return;
  }

  prefetchedCategoryChipHrefs.add(href);
  startTransition(() => {
    router.prefetch(href);
  });
}

export interface ChipCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Discover button — removes the category param and navigates to the current
 * path. Never treat category=all as Discover.
 */
export function DiscoverButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const category = searchParams.get("category");
  const isDiscover = category === null;

  const discoverUrl = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();

  function handleClick() {
    beginResourcesNavigation("discover", discoverUrl);
    startTransition(() => {
      router.push(discoverUrl, { scroll: false });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => prefetchCategoryChipHref(router, discoverUrl)}
      onFocus={() => prefetchCategoryChipHref(router, discoverUrl)}
      disabled={isPending}
      aria-label="Discover resources"
      aria-busy={isPending}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-small transition sm:px-4",
        isDiscover
          ? "border-primary-200 bg-primary-50 text-primary-700"
          : "border-border-subtle bg-white/90 text-text-secondary hover:border-surface-300 hover:bg-white hover:text-text-primary",
        isPending && "cursor-wait opacity-70"
      )}
    >
      Discover
    </button>
  );
}

interface CategoryChipsProps {
  categories: ChipCategory[];
}

/**
 * Category filter chips. Each chip navigates to the current path with only
 * the category param swapped. Uses useTransition so the clicked chip shows
 * an optimistic active state immediately while the route is loading.
 */
export function CategoryChips({ categories }: CategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const category = searchParams.get("category");
  const isAll = category === "all";

  function chipUrl(slug: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", slug);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  function navigate(slug: string) {
    setPendingSlug(slug);
    beginResourcesNavigation("listing", chipUrl(slug));
    startTransition(() => {
      router.push(chipUrl(slug), { scroll: false });
    });
  }

  return (
    <div
      role="navigation"
      aria-label="Filter by category"
      className="flex shrink-0 items-center gap-1.5 pr-3"
    >
      <Chip
        label="All"
        active={isAll}
        pending={pendingSlug === "all" && isPending}
        anyPending={isPending}
        onClick={() => navigate("all")}
        onPointerIntent={() => prefetchCategoryChipHref(router, chipUrl("all"))}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          label={cat.name}
          active={category === cat.slug}
          pending={pendingSlug === cat.slug && isPending}
          anyPending={isPending}
          onClick={() => navigate(cat.slug)}
          onPointerIntent={() => prefetchCategoryChipHref(router, chipUrl(cat.slug))}
        />
      ))}
    </div>
  );
}

/* ── Chip ────────────────────────────────────────────────────────────────── */

function Chip({
  label,
  active,
  pending,
  anyPending,
  onClick,
  onPointerIntent,
}: {
  label: string;
  active: boolean;
  /** This specific chip is the navigation target (optimistic active). */
  pending: boolean;
  /** Any chip navigation is in-flight. */
  anyPending: boolean;
  onClick: () => void;
  onPointerIntent: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onPointerIntent}
      onFocus={onPointerIntent}
      disabled={anyPending}
      aria-pressed={active}
      aria-busy={pending}
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-caption transition sm:text-small",
        // Active or optimistically-pending target → blue
        active || pending
          ? "border-primary-200 bg-primary-50 text-primary-700"
          : "border-transparent bg-transparent text-text-secondary hover:border-surface-200 hover:bg-white hover:text-text-primary",
        // The chip being navigated to: cursor-wait + slight fade
        pending && "cursor-wait opacity-75",
        // Non-target chips dim while any navigation is pending
        anyPending && !pending && !active && "opacity-40"
      )}
    >
      {label}
    </button>
  );
}
