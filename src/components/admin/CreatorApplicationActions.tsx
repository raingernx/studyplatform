"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

interface Props {
  userId: string;
}

export function CreatorApplicationActions({ userId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function handleAction(action: "approve" | "reject") {
    setError("");
    setBusy(action);
    try {
      const body: Record<string, string> = { action };
      if (action === "reject") {
        if (!reason.trim()) {
          setError("Please provide a rejection reason.");
          setBusy(null);
          return;
        }
        body.reason = reason.trim();
      }

      const res = await fetch(`/api/admin/creators/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Action failed. Please try again.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (showRejectForm) {
    return (
      <div className="space-y-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason (shown to the applicant)…"
          rows={2}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground
                     placeholder:text-muted-foreground outline-none transition focus:border-destructive/60 focus:ring-2 focus:ring-destructive/15"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("reject")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            Confirm rejection
          </button>
          <button
            onClick={() => { setShowRejectForm(false); setError(""); }}
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction("approve")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {busy === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        Approve
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <X className="h-3 w-3" />
        Reject
      </button>
    </div>
  );
}
