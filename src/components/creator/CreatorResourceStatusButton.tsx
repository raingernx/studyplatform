"use client";

import { useState } from "react";
import { RowActionButton } from "@/design-system";
import { useRouter } from "next/navigation";

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
  const [success, setSuccess] = useState<string | null>(null);

  const actions =
    status === "PUBLISHED"
      ? [
          { status: "DRAFT" as const, label: "Unpublish", tone: "default" as const },
          { status: "ARCHIVED" as const, label: "Archive", tone: "muted" as const },
        ]
      : status === "ARCHIVED"
        ? [
            { status: "DRAFT" as const, label: "Restore to draft", tone: "default" as const },
            { status: "PUBLISHED" as const, label: "Publish", tone: "default" as const },
          ]
        : [
            { status: "PUBLISHED" as const, label: "Publish", tone: "default" as const },
            { status: "ARCHIVED" as const, label: "Archive", tone: "muted" as const },
          ];

  async function handleStatusChange(nextStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED", label: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);

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

      setSuccess(`${label} complete.`);
      router.refresh();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((action) => (
          <RowActionButton
            key={action.status}
            type="button"
            tone={action.tone}
            disabled={busy}
            onClick={() => void handleStatusChange(action.status, action.label)}
          >
            {busy ? "Saving..." : action.label}
          </RowActionButton>
        ))}
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {!error && success && <p className="text-[11px] text-emerald-600">{success}</p>}
    </div>
  );
}
