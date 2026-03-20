import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getAdminReviews } from "@/services/review.service";
import { ReviewVisibilityAction } from "@/components/admin/ReviewVisibilityAction";

export const metadata = {
  title: "Reviews – Admin",
  description: "Moderate user reviews for marketplace resources.",
};

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/reviews");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const reviews = await getAdminReviews(session.user.id);

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
          Reviews
        </h1>
        <p className="mt-1 text-meta text-text-secondary">
          Review marketplace feedback and hide public reviews when moderation is needed.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-5 py-3 font-medium text-text-secondary">
                  Resource
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  User
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Rating
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Review
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Created
                </th>
                <th className="px-3 py-3 font-medium text-text-secondary">
                  Status
                </th>
                <th className="px-3 py-3 text-right font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="bg-white">
                    <td className="px-5 py-3 text-sm font-medium text-text-primary">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/resources/${review.resource.slug}`}
                          className="transition hover:text-brand-700"
                        >
                          {review.resource.title}
                        </Link>
                        <span className="text-xs font-normal text-text-muted">
                          {review.resource.slug}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <div className="flex flex-col">
                        <span>{review.user.name ?? "Anonymous"}</span>
                        <span className="text-xs text-text-muted">
                          {review.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary tabular-nums">
                      {review.rating}/5
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <p className="line-clamp-2 max-w-md">
                        {review.body ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          review.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600",
                        ].join(" ")}
                      >
                        {review.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ReviewVisibilityAction
                        reviewId={review.id}
                        isVisible={review.isVisible}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
