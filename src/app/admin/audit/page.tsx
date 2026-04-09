import { Suspense } from "react";
import {
  getAdminAuditFilterData,
  getAdminAuditResultsData,
} from "@/services/admin";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { AdminAuditResultsSkeleton } from "@/components/skeletons/AdminCoreRouteSkeletons";
import { AuditTrailResults, AuditTrailShell } from "./AuditTrailClient";

const PAGE_SIZE = 25;

interface AdminAuditPageProps {
  searchParams?: Promise<{
    page?: string;
    action?: string;
    adminId?: string;
    from?: string;
    to?: string;
  }>;
}

export const metadata = {
  title: "Audit Trail – Admin",
  description: "View a detailed audit trail of admin actions.",
};

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = Math.max(1, Number(resolvedSearchParams?.page ?? "1") || 1);
  const actionFilter = (resolvedSearchParams?.action ?? "").trim();
  const adminIdFilter = (resolvedSearchParams?.adminId ?? "").trim();
  const from = (resolvedSearchParams?.from ?? "").trim();
  const to = (resolvedSearchParams?.to ?? "").trim();

  return withRequestPerformanceTrace(
    "route:/admin/audit",
    {
      actionFilter: actionFilter || "all",
      adminIdFilter: adminIdFilter || "all",
      hasDateFilter: Boolean(from || to),
      page,
    },
    async () => {
      const filtersPromise = traceServerStep(
        "admin_audit.getAdminAuditFilterData",
        () => getAdminAuditFilterData(),
      );
      const resultsPromise = traceServerStep(
        "admin_audit.getAdminAuditResultsData",
        () =>
          getAdminAuditResultsData({
            page,
            actionFilter,
            adminIdFilter,
            from,
            to,
            pageSize: PAGE_SIZE,
          }),
        {
          actionFilter: actionFilter || "all",
          adminIdFilter: adminIdFilter || "all",
          hasDateFilter: Boolean(from || to),
          page,
        },
      );

      const { actionOptions, adminOptions } = await filtersPromise;

      return (
        <AuditTrailShell
          actionOptions={actionOptions}
          adminOptions={adminOptions}
          initialFilters={{
            action: actionFilter || "all",
            adminId: adminIdFilter || "all",
            from,
            to,
          }}
        >
          <Suspense fallback={<AdminAuditResultsSkeleton />}>
            <AdminAuditResultsSection dataPromise={resultsPromise} page={page} />
          </Suspense>
        </AuditTrailShell>
      );
    },
  );
}

async function AdminAuditResultsSection({
  dataPromise,
  page,
}: {
  dataPromise: ReturnType<typeof getAdminAuditResultsData>;
  page: number;
}) {
  const { items, totalPages } = await dataPromise;

  return (
    <AuditTrailResults
      items={items}
      pagination={{
        page,
        totalPages,
      }}
    />
  );
}
