import { Suspense } from "react";
import Link from "next/link";
import { getAllCreatorApplications } from "@/services/creator";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreatorApplicationActions } from "@/components/admin/CreatorApplicationActions";
import {
  AdminCreatorsResultsSkeleton,
  AdminCreatorsSummarySkeleton,
} from "@/components/skeletons/AdminCoreRouteSkeletons";
import { isTransientPrismaInfrastructureError } from "@/lib/prismaErrors";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Creator Applications – Admin",
  description: "Review and manage creator access applications.",
};

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING:  { label: "Pending",  className: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 ring-1 ring-green-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 ring-1 ring-red-200" },
};

export default async function AdminCreatorsPage() {
  const applicationsStatePromise = loadCreatorApplicationsState();

  return (
    <div className="min-w-0 space-y-8">
      <AdminPageHeader
        title="Creator Applications"
        description="Review and manage creator access applications."
      />
      <Suspense fallback={<AdminCreatorsSummarySkeleton />}>
        <AdminCreatorApplicationsSummary
          applicationsStatePromise={applicationsStatePromise}
        />
      </Suspense>
      <Suspense fallback={<AdminCreatorsResultsSkeleton />}>
        <AdminCreatorApplicationsResults
          applicationsStatePromise={applicationsStatePromise}
        />
      </Suspense>
    </div>
  );
}

async function loadCreatorApplicationsState() {
  let applications;

  try {
    applications = await getAllCreatorApplications();
  } catch (error) {
    if (isTransientPrismaInfrastructureError(error)) {
      console.error("[ADMIN_CREATORS_FALLBACK]", {
        error:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : String(error),
        fallbackApplied: true,
      });
      return {
        applications: [],
        unavailable: true as const,
      };
    }

    throw error;
  }

  return { applications, unavailable: false as const };
}

async function AdminCreatorApplicationsSummary({
  applicationsStatePromise,
}: {
  applicationsStatePromise: ReturnType<typeof loadCreatorApplicationsState>;
}) {
  const state = await applicationsStatePromise;

  if (state.unavailable) {
    return null;
  }

  const applications = state.applications;
  const pending   = applications.filter((a) => a.creatorApplicationStatus === "PENDING");
  const rest      = applications.filter((a) => a.creatorApplicationStatus !== "PENDING");
  const approved = applications.filter((a) => a.creatorApplicationStatus === "APPROVED").length;
  const rejected = applications.filter((a) => a.creatorApplicationStatus === "REJECTED").length;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Pending</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {pending.length}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Approved</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {approved}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-sm text-muted-foreground">Rejected</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {rejected}
        </p>
      </div>
    </div>
  );
}

async function AdminCreatorApplicationsResults({
  applicationsStatePromise,
}: {
  applicationsStatePromise: ReturnType<typeof loadCreatorApplicationsState>;
}) {
  const state = await applicationsStatePromise;

  if (state.unavailable) {
    return <AdminCreatorsUnavailableState />;
  }

  const applications = state.applications;
  const pending   = applications.filter((a) => a.creatorApplicationStatus === "PENDING");
  const rest      = applications.filter((a) => a.creatorApplicationStatus !== "PENDING");
  const sorted    = [...pending, ...rest];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pending.length} pending · {applications.length} total
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Creator Name / Slug
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bio
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Applied
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((app) => {
                const badge = STATUS_BADGE[app.creatorApplicationStatus] ?? STATUS_BADGE.PENDING;
                return (
                  <tr key={app.id} className="hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{app.name ?? "—"}</p>
                      <p className="text-[12px] text-muted-foreground">{app.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{app.creatorDisplayName ?? "—"}</p>
                      {app.creatorSlug && (
                        <p className="text-[12px] text-muted-foreground">/creators/{app.creatorSlug}</p>
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="line-clamp-2 text-[12px] text-muted-foreground">
                        {app.creatorBio ?? <span className="italic text-muted-foreground/70">No bio</span>}
                      </p>
                      {app.creatorApplicationStatus === "REJECTED" && app.rejectionReason && (
                        <p className="mt-1 text-[11px] text-red-600">
                          <span className="font-medium">Reason: </span>
                          {app.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-muted-foreground">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {app.creatorApplicationStatus === "PENDING" ? (
                        <CreatorApplicationActions userId={app.id} />
                      ) : (
                        <span className="text-[12px] text-muted-foreground/70">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminCreatorsUnavailableState() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-card">
      <div className="space-y-3">
        <p className="font-ui text-caption tracking-[0.12em] text-primary">
          Creator applications temporarily unavailable
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          This creator moderation view could not refresh right now.
        </h2>
        <p className="mx-auto max-w-2xl text-small leading-6 text-muted-foreground">
          The admin shell is still available, but the application queue hit a temporary service
          issue. Try the page again in a moment.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={routes.adminCreators}
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
