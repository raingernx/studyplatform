"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  FilterSidebar,
  type FilterCategory,
} from "@/components/marketplace/FilterSidebar";

interface MobileFilterDialogProps {
  categories: FilterCategory[];
  activeCount: number;
  className?: string;
}

export function MobileFilterDialog({
  categories,
  activeCount,
  className,
}: MobileFilterDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger
        aria-label={activeCount > 0 ? `Browse filters (${activeCount} active)` : "Browse filters"}
        className={cn(
          "inline-flex min-h-11 sm:min-h-10 w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-surface-200 bg-surface-50 px-3.5 py-2 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2 sm:w-auto",
          className,
        )}
      >
        <SlidersHorizontal className="h-4 w-4 text-text-muted" />
        <span>{activeCount > 0 ? `Filters (${activeCount})` : "Filters"}</span>
      </Modal.Trigger>

      <Modal.Content size="lg" className="max-h-[min(88vh,760px)] p-0">
        <Modal.Header>
          <Modal.Title>Browse filters</Modal.Title>
          <Modal.Description>
            Refine categories, difficulty, and resource type. Sort and price stay
            available in the main toolbar.
          </Modal.Description>
        </Modal.Header>

        <Modal.Body className="px-4 py-4 sm:px-5">
          <FilterSidebar
            categories={categories}
            className="w-full space-y-5"
            showSort={false}
            showPrice={false}
            onNavigate={() => setOpen(false)}
          />
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
