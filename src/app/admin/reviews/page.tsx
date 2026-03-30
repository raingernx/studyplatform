import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { getAdminReviews, ReviewServiceError } from "@/services/review.service";
import { ReviewVisibilityAction } from "@/components/admin/ReviewVisibilityAction";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { routes } from "@/lib/routes";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
} from "@/components/admin/table";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Reviews – Admin",
  description: "Moderate user reviews for marketplace resources.",
};

export default async function AdminReviewsPage() {
  const session = await requireAdminSession(routes.adminReviews);

  let reviews;

  try {
    reviews = await getAdminReviews(session.user.id);
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      if (error.status === 401) {
        redirect(routes.loginWithNext(routes.adminReviews));
      }

      if (error.status === 403) {
        redirect(routes.dashboard);
      }
    }

    throw error;
  }

  return (
    <div className="min-w-0 space-y-8">
      <AdminPageHeader
        title="Reviews"
        description="Review marketplace feedback and hide public reviews when moderation is needed."
      />

      <DataTable minWidth="min-w-[900px]">
        <DataTableHeader>
          <tr>
            <DataTableHeadCell className="px-2">
                  Resource
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  User
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Rating
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Review
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Created
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Status
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3" align="right">
                  Actions
            </DataTableHeadCell>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {reviews.length === 0 ? (
            <TableEmptyState message="No reviews yet" />
          ) : (
            reviews.map((review) => (
              <DataTableRow key={review.id}>
                <DataTableCell className="px-2 font-medium text-text-primary">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={routes.resource(review.resource.slug)}
                      className="transition hover:text-primary-700"
                    >
                      {review.resource.title}
                    </Link>
                    <span className="text-caption font-normal text-text-muted">
                      {review.resource.slug}
                    </span>
                  </div>
                </DataTableCell>
                <DataTableCell className="px-3 text-text-secondary">
                  <div className="flex flex-col">
                    <span>{review.user.name ?? "Anonymous"}</span>
                    <span className="text-caption text-text-muted">
                      {review.user.email}
                    </span>
                  </div>
                </DataTableCell>
                <DataTableCell className="px-3 tabular-nums text-text-secondary">
                  {review.rating}/5
                </DataTableCell>
                <DataTableCell className="px-3 text-text-secondary">
                  <p className="line-clamp-2 max-w-md">
                    {review.body ?? "—"}
                  </p>
                </DataTableCell>
                <DataTableCell className="px-3 text-text-secondary">
                  {formatDate(review.createdAt)}
                </DataTableCell>
                <DataTableCell className="px-3 text-text-secondary">
                  <StatusBadge
                    status={review.isVisible ? "VISIBLE" : "HIDDEN"}
                    label={review.isVisible ? "Visible" : "Hidden"}
                    tone={review.isVisible ? "success" : "muted"}
                  />
                </DataTableCell>
                <DataTableCell className="px-3" align="right">
                  <ReviewVisibilityAction
                    reviewId={review.id}
                    isVisible={review.isVisible}
                  />
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
