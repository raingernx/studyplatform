import { BadgeCheck, Star } from "lucide-react";
import { formatDate } from "@/lib/format";

export interface ResourceReviewItem {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date | string;
  user: { name: string | null };
}

interface ResourceReviewsProps {
  reviews: ResourceReviewItem[];
  resourceTitle: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"
          }`}
        />
      ))}
    </span>
  );
}

export function ResourceReviews({ reviews, resourceTitle }: ResourceReviewsProps) {
  return (
    <section id="reviews">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-zinc-900">Reviews</h2>
        <p className="text-[13px] text-zinc-500">
          Visible feedback from verified buyers of {resourceTitle}.
        </p>
      </div>
      {reviews.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-6 text-center text-[13px] text-zinc-500">
          <p>Reviews for {resourceTitle} will appear here.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-4"
            >
              <div className="flex items-center justify-between gap-2">
                <StarRating rating={review.rating} />
                <span className="text-[12px] text-zinc-400">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.user.name && (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[12px] font-medium text-zinc-600">{review.user.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    Verified buyer
                  </span>
                </div>
              )}
              {review.body && (
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-700">
                  {review.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
