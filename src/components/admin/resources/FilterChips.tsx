"use client";

import { X } from "lucide-react";

import { Button } from "@/design-system";

type FilterKey = "search" | "status" | "categoryId";

export interface AdminFilterChipsProps {
  filters: {
    search: string;
    status: string;
    categoryId: string;
  };
  categories: { id: string; name: string }[];
  onRemove: (key: FilterKey) => void;
  onClearAll?: () => void;
}

export function FilterChips({
  filters,
  categories,
  onRemove,
  onClearAll,
}: AdminFilterChipsProps) {
  const chips: { key: FilterKey; label: string; value: string }[] = [];

  if (filters.search.trim()) {
    chips.push({
      key: "search",
      label: "Search",
      value: filters.search.trim(),
    });
  }

  if (filters.status) {
    const label =
      filters.status === "PUBLISHED"
        ? "Published"
        : filters.status === "DRAFT"
          ? "Draft"
          : filters.status === "ARCHIVED"
            ? "Archived"
            : filters.status;
    chips.push({
      key: "status",
      label: "Status",
      value: label,
    });
  }

  if (filters.categoryId) {
    const category = categories.find((c) => c.id === filters.categoryId);
    chips.push({
      key: "categoryId",
      label: "Category",
      value: category?.name ?? "Unknown",
    });
  }

  if (!chips.length) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
        >
          <span className="font-medium">
            {chip.label}:{" "}
            <span className="font-normal text-foreground">{chip.value}</span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label={`Clear ${chip.label.toLowerCase()} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {chips.length > 1 && onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-muted-foreground"
          onClick={onClearAll}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}
