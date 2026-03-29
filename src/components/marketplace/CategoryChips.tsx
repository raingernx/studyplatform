"use client";

import { startTransition, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
          : "border-surface-200 bg-surface-50 text-text-secondary hover:border-surface-300 hover:bg-surface-100 hover:text-text-primary",
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const category = searchParams.get("category");
  const isAll = category === "all";
  const primaryCategories = useMemo(() => categories.slice(0, 7), [categories]);
  const overflowCategories = useMemo(() => categories.slice(7), [categories]);
  const activeOverflowCategory =
    overflowCategories.find((cat) => category === cat.slug) ?? null;

  function chipUrl(slug: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", slug);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  function navigate(slug: string) {
    setPendingSlug(slug);
    setMoreOpen(false);
    beginResourcesNavigation("listing", chipUrl(slug));
    startTransition(() => {
      router.push(chipUrl(slug), { scroll: false });
    });
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      role="navigation"
      aria-label="กรองตามหมวดหมู่"
      className="flex shrink-0 items-center gap-2 pr-2"
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
          className="lg:hidden"
        />
      ))}

      {primaryCategories.map((cat) => (
        <Chip
          key={`desktop-${cat.id}`}
          label={getCategoryLabel(cat.name)}
          active={category === cat.slug}
          pending={pendingSlug === cat.slug && isPending}
          anyPending={isPending}
          onClick={() => navigate(cat.slug)}
          className="hidden lg:inline-flex"
        />
      ))}

      {overflowCategories.length > 0 ? (
        <div ref={moreRef} className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            disabled={isPending}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label="หมวดหมู่เพิ่มเติม"
            className={cn(
              chipClassName(Boolean(activeOverflowCategory), false, isPending, "inline-flex"),
              moreOpen && "border-surface-300 bg-surface-100 text-text-primary",
            )}
          >
            <span>{activeOverflowCategory ? getCategoryLabel(activeOverflowCategory.name) : "เพิ่มเติม"}</span>
            <ChevronDown
              className={cn("h-4 w-4 text-current transition-transform", moreOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {moreOpen ? (
            <div
              role="menu"
              aria-label="หมวดหมู่เพิ่มเติม"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[220px] overflow-hidden rounded-2xl border border-surface-200 bg-white p-1.5 shadow-card-lg"
            >
              <div className="flex max-h-72 flex-col overflow-y-auto">
                {overflowCategories.map((cat) => (
                  <button
                    key={`more-${cat.id}`}
                    type="button"
                    role="menuitem"
                    onClick={() => navigate(cat.slug)}
                    disabled={isPending}
                    className={cn(
                      "flex h-10 items-center rounded-xl px-3.5 text-left text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
                      category === cat.slug || (pendingSlug === cat.slug && isPending)
                        ? "bg-primary-100 text-primary-800"
                        : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
                    )}
                  >
                    {getCategoryLabel(cat.name)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
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
      : "border-surface-200 bg-surface-50 text-text-secondary hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800",
    pending && "cursor-wait opacity-75",
    anyPending && !pending && !active && "opacity-40",
    className,
  );
}
