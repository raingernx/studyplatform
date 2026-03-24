"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { SORT_OPTIONS, normaliseSortParam } from "@/config/sortOptions";
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

  const hasActiveFilterControls = price !== "" || sort !== "newest";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const isEmpty = value === "" || (key === "sort" && value === "newest");
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
        "flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-3 shadow-card transition-opacity sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4",
        isPending && "opacity-60"
      )}
    >
      {/* Result count */}
      <p className="shrink-0 text-sm font-medium text-text-secondary">
        {total === 1 ? "1 resource" : `${formatNumber(total)} resources`}
      </p>

      {/* Filter selects + clear */}
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
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
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-surface-300 hover:bg-white disabled:cursor-wait sm:col-span-1"
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
  const isActive = value !== "" && value !== "newest";

  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "min-h-11 w-full appearance-none cursor-pointer rounded-xl border py-2.5 pl-3.5 pr-9",
          "text-sm font-medium outline-none transition-colors",
          "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15",
          "disabled:cursor-wait",
          isActive
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-surface-200 bg-white text-text-secondary hover:border-surface-300",
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </div>
  );
}
