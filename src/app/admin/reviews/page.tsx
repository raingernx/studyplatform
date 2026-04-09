import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isTransientPrismaInfrastructureError } from "@/lib/prismaErrors";
import { formatDate } from "@/lib/format";
import { getAdminReviews, ReviewServiceError } from "@/services/reviews";
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
import {
  AdminReviewsResultsSkeleton,
  AdminReviewsSummarySkeleton,
} from "@/components/skeletons/AdminCoreRouteSkeletons";

export const metadata = {
  title: "Reviews – Admin",
  description: "Moderate user reviews for marketplace resources.",
};

export default async function AdminReviewsPage() {
  const reviewsStatePromise = loadAdminReviewsState();

  return (
    <div className="min-w-0 space-y-8">
      <AdminPageHeader
        title="Reviews"
        description="Review marketplace feedback and hide public reviews when moderation is needed."
      />
      <Suspense fallback={<AdminReviewsSummarySkeleton />}>
        <AdminReviewsSummary reviewsStatePromise={reviewsStatePromise} />
      </Suspense>
      <Suspense fallback={<AdminReviewsResultsSkeleton />}>
        <AdminReviewsResults reviewsStatePromise={reviewsStatePromise} />
      </Suspense>
    </div>
  );
}

async function loadAdminReviewsState() {
  let reviews;

  try {
    reviews = await getAdminReviews();
  } catch (error) {
    if (error instanceof ReviewServiceError) {
      if (error.status === 401) {
        redirect(routes.loginWithNext(routes.adminReviews));
      }

      if (error.status === 403) {
        redirect(routes.dashboard);
      }
    }

    if (isTransientPrismaInfrastructureError(error)) {
      console.error("[ADMIN_REVIEWS_FALLBACK]", {
        error:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : String(error),
        fallbackApplied: true,
      });
      return {
        reviews: [],
        unavailable: true as const,
      };
    }

    throw error;
  }

  return { reviews, unavailable: false as const };
}

async function AdminReviewsSummary({
  reviewsStatePromise,
}: {
  reviewsStatePromise: ReturnType<typeof loadAdminReviewsState>;
}) {
  const state = await reviewsStatePromise;

  if (state.unavailable) {
    return null;
  }

  const reviews = state.reviews;
  const visibleCount = reviews.filter((review) => review.isVisible).length;
  const hiddenCount = reviews.length - visibleCount;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Total reviews</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {reviews.length}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Visible now</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {visibleCount}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hiddenCount} hidden</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Average rating</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {averageRating ? averageRating.toFixed(1) : "—"}
        </p>
      </div>
    </div>
  );
}

async function AdminReviewsResults({
  reviewsStatePromise,
}: {
  reviewsStatePromise: ReturnType<typeof loadAdminReviewsState>;
}) {
  const state = await reviewsStatePromise;

  if (state.unavailable) {
    return <AdminReviewsUnavailableState />;
  }

  const reviews = state.reviews;

  return (
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
              <DataTableCell className="px-2 font-medium text-foreground">
                <div className="flex flex-col gap-1">
                  <Link
                    href={routes.resource(review.resource.slug)}
                    className="transition hover:text-primary-700"
                  >
                    {review.resource.title}
                  </Link>
                  <span className="text-caption font-normal text-muted-foreground">
                    {review.resource.slug}
                  </span>
                </div>
              </DataTableCell>
              <DataTableCell className="px-3 text-muted-foreground">
                <div className="flex flex-col">
                  <span>{review.user.name ?? "Anonymous"}</span>
                  <span className="text-caption text-muted-foreground">
                    {review.user.email}
                  </span>
                </div>
              </DataTableCell>
              <DataTableCell className="px-3 tabular-nums text-muted-foreground">
                {review.rating}/5
              </DataTableCell>
              <DataTableCell className="px-3 text-muted-foreground">
                <p className="line-clamp-2 max-w-md">
                  {review.body ?? "—"}
                </p>
              </DataTableCell>
              <DataTableCell className="px-3 text-muted-foreground">
                {formatDate(review.createdAt)}
              </DataTableCell>
              <DataTableCell className="px-3 text-muted-foreground">
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
  );
}

function AdminReviewsUnavailableState() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-card">
      <div className="space-y-3">
        <p className="font-ui text-caption tracking-[0.12em] text-primary">
          Reviews temporarily unavailable
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          This moderation view could not refresh right now.
        </h2>
        <p className="mx-auto max-w-2xl text-small leading-6 text-muted-foreground">
          The admin shell is still available, but the review list hit a temporary service issue.
          Try this page again in a moment.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={routes.adminReviews}
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-small font-semibold text-white transition hover:bg-brand-700"
        >
          Try again
        </Link>
        <Link
          href={routes.admin}
          className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-small font-medium text-foreground transition hover:bg-muted"
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
