"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export function BecomeCreatorButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/creator/activate", {
        method: "POST",
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to enable creator access.");
      }

      router.push(routes.creatorDashboard);
      router.refresh();
    } catch (activateError) {
      setError(
        activateError instanceof Error
          ? activateError.message
          : "Failed to enable creator access.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="md" onClick={handleClick} loading={submitting}>
        Become a Creator
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
