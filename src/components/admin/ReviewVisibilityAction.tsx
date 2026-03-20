"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RowActionButton, RowActions } from "@/design-system";

interface ReviewVisibilityActionProps {
  reviewId: string;
  isVisible: boolean;
}

export function ReviewVisibilityAction({
  reviewId,
  isVisible,
}: ReviewVisibilityActionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVisibilityChange(nextVisibility: boolean) {
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVisible: nextVisibility }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update review visibility.");
      }

      router.refresh();
    } catch (visibilityError) {
      setError(
        visibilityError instanceof Error
          ? visibilityError.message
          : "Failed to update review visibility.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <RowActions>
        <RowActionButton
          type="button"
          disabled={busy}
          loading={busy}
          tone={isVisible ? "danger" : "default"}
          onClick={() => void handleVisibilityChange(!isVisible)}
        >
          {isVisible ? "Hide" : "Unhide"}
        </RowActionButton>
      </RowActions>
      {error && <p className="text-[11px] text-danger-600">{error}</p>}
    </div>
  );
}
