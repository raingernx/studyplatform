"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { DEFAULT_SORT, SORT_OPTIONS, normaliseSortParam } from "@/config/sortOptions";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";

const PRICE_OPTIONS = [
  { value: "",     label: "Any price" },
  { value: "free", label: "Free"      },
  { value: "paid", label: "Paid"      },
] as const;

/* ── FilterBar ───────────────────────────────────────────────────────────── */

interface Props {
  /** Total result count rendered on the left side */
  total: number;
}

/**
 * Compact filter row below the category chips.
 * Reads/writes ?sort= and ?price= URL params; resets to page 1 on every change.
 * Uses useTransition so controls show a disabled/pending state immediately
 * while the route is loading — eliminates the frozen-click feeling.
 */
export function FilterBar({ total }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sort  = normaliseSortParam(searchParams.get("sort"));
  const price = searchParams.get("price") ?? "";

  const hasActiveFilterControls = price !== "" || sort !== DEFAULT_SORT;

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const isEmpty = value === "" || (key === "sort" && value === DEFAULT_SORT);
    if (isEmpty) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const href = `${pathname}?${params.toString()}`;
    beginResourcesNavigation("listing", href);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function clearFilterControls() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("price");
    params.delete("sort");
    params.delete("page");
    const href = `${pathname}?${params.toString()}`;
    beginResourcesNavigation("listing", href);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 transition-opacity sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        isPending && "opacity-60"
      )}
    >
      {/* Result count */}
      <p className="shrink-0 text-small text-muted-foreground">
        {total === 1 ? "1 resource" : `${formatNumber(total)} resources`}
      </p>

      {/* Filter selects + clear */}
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
        <FilterSelect
          value={price}
          options={PRICE_OPTIONS}
          onChange={(v) => update("price", v)}
          disabled={isPending}
          aria-label="Filter by price"
        />
        <FilterSelect
          value={sort}
          options={SORT_OPTIONS}
          onChange={(v) => update("sort", v)}
          disabled={isPending}
          aria-label="Sort resources"
        />
        {hasActiveFilterControls && (
          <button
            type="button"
            onClick={clearFilterControls}
            disabled={isPending}
            aria-label="Clear sort and price filters"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-transparent px-3 py-2 text-caption text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/* ── FilterSelect ────────────────────────────────────────────────────────── */

function FilterSelect({
  value,
  options,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const isActive = value !== "" && value !== DEFAULT_SORT;

  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "min-h-11 w-full appearance-none cursor-pointer rounded-full border py-2.5 pl-3.5 pr-9",
          "text-small outline-none transition-colors",
          "focus:border-primary-300 focus:ring-2 focus:ring-primary-500/12",
          "focus-visible:border-primary-300 focus-visible:ring-2 focus-visible:ring-primary-500/12",
          "disabled:cursor-not-allowed disabled:opacity-60",
          isActive
            ? "border-primary-200 bg-primary-50 text-primary-700"
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
