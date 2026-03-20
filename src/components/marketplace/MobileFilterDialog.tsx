"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  FilterSidebar,
  type FilterCategory,
} from "@/components/marketplace/FilterSidebar";

interface MobileFilterDialogProps {
  categories: FilterCategory[];
}

export function MobileFilterDialog({ categories }: MobileFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const activeCount = [
    searchParams.get("category") &&
    searchParams.get("category") !== "all",
    Boolean(searchParams.get("tag")),
  ].filter(Boolean).length;

  return (
    <div className="lg:hidden">
      <Modal.Root open={open} onOpenChange={setOpen}>
        <Modal.Trigger
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-text-primary shadow-sm transition hover:border-surface-300 hover:bg-surface-50"
        >
          <SlidersHorizontal className="h-4 w-4 text-text-muted" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
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
    </div>
  );
}
