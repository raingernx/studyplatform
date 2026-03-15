"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

interface AdminResourcesClearButtonProps {
  hasFilters: boolean;
  onClear?: () => void;
}

export function AdminResourcesClearButton({
  hasFilters,
  onClear,
}: AdminResourcesClearButtonProps) {
  const router = useRouter();

  if (!hasFilters) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        router.push("/admin/resources");
        router.refresh();
        onClear?.();
      }}
    >
      Clear
    </Button>
  );
}

