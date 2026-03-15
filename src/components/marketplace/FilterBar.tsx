"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { SORT_OPTIONS, normaliseSortParam } from "@/config/sortOptions";

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
 */
export function FilterBar({ total }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const sort  = normaliseSortParam(searchParams.get("sort"));
  const price = searchParams.get("price") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const isEmpty = value === "" || (key === "sort" && value === "newest");
    if (isEmpty) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Result count */}
      <p className="shrink-0 text-meta text-text-muted">
        {total === 1 ? "1 resource" : `${formatNumber(total)} resources`}
      </p>

      {/* Filter selects */}
      <div className="flex items-center gap-2">
        <FilterSelect
          value={price}
          options={PRICE_OPTIONS}
          onChange={(v) => update("price", v)}
          aria-label="Filter by price"
        />
        <FilterSelect
          value={sort}
          options={SORT_OPTIONS}
          onChange={(v) => update("sort", v)}
          aria-label="Sort resources"
        />
      </div>
    </div>
  );
}

/* ── FilterSelect ────────────────────────────────────────────────────────── */

function FilterSelect({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  "aria-label"?: string;
}) {
  const isActive = value !== "" && value !== "newest";

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={[
          "appearance-none cursor-pointer rounded-lg border py-2 pl-3 pr-8",
          "text-sm font-medium outline-none transition-colors",
          "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15",
          isActive
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-surface-200 bg-white text-text-secondary hover:border-surface-300",
        ].join(" ")}
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
