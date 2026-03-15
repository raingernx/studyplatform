"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

interface CreatorResourceStatusButtonProps {
  resourceId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export function CreatorResourceStatusButton({
  resourceId,
  status,
}: CreatorResourceStatusButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const label = status === "PUBLISHED" ? "Unpublish" : "Publish";

  async function handleToggle() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/creator/resources/${resourceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to update status.");
      }

      router.refresh();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Saving..." : label}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
