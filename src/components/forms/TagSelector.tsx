"use client";

import { cn } from "@/lib/utils";

export interface TagOption {
  id: string;
  name: string;
  slug: string;
}

/** Multi-select for tags. No business logic — controlled component. */
interface TagSelectorProps {
  options: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagSelector({
  options,
  selectedIds,
  onChange,
  placeholder = "Select tags…",
  className,
}: TagSelectorProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => toggle(opt.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            selectedIds.includes(opt.id)
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          )}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
}
