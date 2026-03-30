import { getAdminAuditPageData } from "@/services/admin-operations.service";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { AuditTrailClient } from "./AuditTrailClient";

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
  await requireAdminSession(routes.adminAudit);

  const page = Math.max(1, Number(resolvedSearchParams?.page ?? "1") || 1);
  const actionFilter = (resolvedSearchParams?.action ?? "").trim();
  const adminIdFilter = (resolvedSearchParams?.adminId ?? "").trim();
  const from = (resolvedSearchParams?.from ?? "").trim();
  const to = (resolvedSearchParams?.to ?? "").trim();

  const { items, actionOptions, adminOptions, totalPages } =
    await getAdminAuditPageData({
      page,
      actionFilter,
      adminIdFilter,
      from,
      to,
      pageSize: PAGE_SIZE,
    });

  return (
    <AuditTrailClient
      items={items}
      actionOptions={actionOptions}
      adminOptions={adminOptions}
      pagination={{
        page,
        totalPages,
      }}
      initialFilters={{
        action: actionFilter || "all",
        adminId: adminIdFilter || "all",
        from,
        to,
      }}
    />
  );
}
