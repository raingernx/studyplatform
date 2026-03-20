"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@/design-system";

interface ResourceReviewFormProps {
  resourceId: string;
  resourceTitle: string;
  existingReview?: {
    rating: number;
    body: string | null;
  } | null;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

export function ResourceReviewForm({
  resourceId,
  resourceTitle,
  existingReview = null,
}: ResourceReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mode = existingReview ? "PATCH" : "POST";

  function clearFeedback() {
    if (error !== null) {
      setError(null);
    }

    if (success !== null) {
      setSuccess(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/resources/${resourceId}/reviews`, {
        method: mode,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save your review.");
      }

      setSuccess(existingReview ? "Your review was updated." : "Your review was published.");
      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Failed to save your review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-surface-200 bg-white p-5 shadow-card sm:p-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-zinc-900">
          {existingReview ? "Update your review" : "Leave a review"}
        </h2>
        <p className="text-sm leading-6 text-zinc-500">
          Share a quick rating for {resourceTitle}. Only people who own this resource can review it.
        </p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900">Your rating</p>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={rating === value ? "primary" : "outline"}
                disabled={busy}
                onClick={() => {
                  clearFeedback();
                  setRating(value);
                }}
              >
                {value} star{value === 1 ? "" : "s"}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900" htmlFor={`review-comment-${resourceId}`}>
            Comment
          </label>
          <Textarea
            id={`review-comment-${resourceId}`}
            value={comment}
            disabled={busy}
            onChange={(event) => {
              clearFeedback();
              setComment(event.target.value);
            }}
            placeholder="What helped most? What should other buyers know?"
            rows={5}
            hint="Optional, but a short comment makes the review more useful."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy} loading={busy}>
            {existingReview ? "Update review" : "Publish review"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && success && <p className="text-sm text-emerald-600">{success}</p>}
        </div>
      </form>
    </section>
  );
}
