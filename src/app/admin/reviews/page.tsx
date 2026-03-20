import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getAdminReviews } from "@/services/review.service";
import { ReviewVisibilityAction } from "@/components/admin/ReviewVisibilityAction";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

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
    <div className="min-w-0 space-y-8">
      <AdminPageHeader
        title="Reviews"
        description="Review marketplace feedback and hide public reviews when moderation is needed."
      />

      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Resource
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  User
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Rating
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Review
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Created
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">
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
                  <tr key={review.id} className="bg-white transition-colors hover:bg-surface-50">
                    <td className="px-2 py-3 text-sm font-medium text-text-primary">
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
                      <StatusBadge
                        status={review.isVisible ? "VISIBLE" : "HIDDEN"}
                        label={review.isVisible ? "Visible" : "Hidden"}
                        tone={review.isVisible ? "success" : "muted"}
                      />
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
    </div>
  );
}
