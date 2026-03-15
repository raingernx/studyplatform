"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/Button";

type FilterState = {
  search: string;
  status: string;
  categoryId: string;
};

export type SavedFilterPresetId =
  | "all"
  | "published"
  | "draft"
  | "highRevenue"
  | "free";

export interface SavedFiltersDropdownProps {
  currentFilters: FilterState;
  onApplyPreset: (preset: SavedFilterPresetId) => void;
}

const PRESET_LABELS: Record<SavedFilterPresetId, string> = {
  all: "All resources",
  published: "Published",
  draft: "Draft",
  highRevenue: "High revenue (> $1k)",
  free: "Free resources",
};

export function SavedFiltersDropdown({
  currentFilters,
  onApplyPreset,
}: SavedFiltersDropdownProps) {
  const [open, setOpen] = useState(false);

  const activePresetLabel =
    currentFilters.status === "PUBLISHED" &&
    !currentFilters.search &&
    !currentFilters.categoryId
      ? PRESET_LABELS.published
      : currentFilters.status === "DRAFT" &&
          !currentFilters.search &&
          !currentFilters.categoryId
        ? PRESET_LABELS.draft
        : !currentFilters.search &&
            !currentFilters.status &&
            !currentFilters.categoryId
          ? PRESET_LABELS.all
          : "Saved filters";

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="inline-flex items-center gap-1"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-xs">{activePresetLabel}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border-subtle bg-white py-1 text-xs shadow-lg">
          {(Object.keys(PRESET_LABELS) as SavedFilterPresetId[]).map((preset) => (
            <button
              key={preset}
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left text-text-secondary hover:bg-surface-50"
              onClick={() => {
                onApplyPreset(preset);
                setOpen(false);
              }}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

