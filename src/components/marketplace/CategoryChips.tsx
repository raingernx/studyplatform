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

const CATEGORY_LABELS: Record<string, string> = {
  "Art & Creativity": "ศิลปะและความคิดสร้างสรรค์",
  "Early Learning": "ปฐมวัย",
  Humanities: "มนุษยศาสตร์",
  Language: "ภาษา",
  Mathematics: "คณิตศาสตร์",
  Science: "วิทยาศาสตร์",
  "Study Skills": "ทักษะการเรียน",
};

function getCategoryLabel(name: string) {
  return CATEGORY_LABELS[name] ?? name;
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
      aria-label="ค้นหาทรัพยากร"
      aria-busy={isPending}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        isDiscover
          ? "border-primary-300 bg-primary-100 text-primary-800 shadow-sm"
          : "border-border-strong bg-background text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
        isPending && "cursor-wait opacity-70"
      )}
    >
      ค้นหา
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
      aria-label="กรองตามหมวดหมู่"
      className="flex shrink-0 items-center gap-2.5 pr-3"
    >
      <Chip
        label="ทั้งหมด"
        active={isAll}
        pending={pendingSlug === "all" && isPending}
        anyPending={isPending}
        onClick={() => navigate("all")}
      />

      {categories.map((cat) => (
        <Chip
          key={cat.id}
          label={getCategoryLabel(cat.name)}
          active={category === cat.slug}
          pending={pendingSlug === cat.slug && isPending}
          anyPending={isPending}
          onClick={() => navigate(cat.slug)}
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
  className,
}: {
  label: string;
  active: boolean;
  /** This specific chip is the navigation target (optimistic active). */
  pending: boolean;
  /** Any chip navigation is in-flight. */
  anyPending: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={anyPending}
      aria-pressed={active}
      aria-busy={pending}
      className={chipClassName(active, pending, anyPending, className)}
    >
      {label}
    </button>
  );
}

function chipClassName(
  active: boolean,
  pending: boolean,
  anyPending: boolean,
  className?: string,
) {
  return cn(
    "inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
    active || pending
      ? "border-primary-400 bg-primary-100 text-primary-900 shadow-sm"
      : "border-border-strong bg-background text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
    pending && "cursor-wait opacity-75",
    anyPending && !pending && !active && "opacity-40",
    className,
  );
}
