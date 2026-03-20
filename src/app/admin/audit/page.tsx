import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/audit");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const page = Math.max(1, Number(resolvedSearchParams?.page ?? "1") || 1);
  const actionFilter = (resolvedSearchParams?.action ?? "").trim();
  const adminIdFilter = (resolvedSearchParams?.adminId ?? "").trim();
  const from = (resolvedSearchParams?.from ?? "").trim();
  const to = (resolvedSearchParams?.to ?? "").trim();

  const where: any = {};

  if (actionFilter) {
    where.action = actionFilter;
  }

  if (adminIdFilter) {
    where.adminId = adminIdFilter;
  }

  if (from) {
    where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(from) };
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { ...(where.createdAt ?? {}), lte: end };
  }

  const skip = (page - 1) * PAGE_SIZE;

  const [logs, total, actions, admins] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
    prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actionOptions = actions.map((a) => a.action);

  return (
    <AuditTrailClient
      items={logs.map((log) => ({
        id: log.id,
        admin: {
          id: log.admin.id,
          name: log.admin.name ?? "Unknown",
          email: log.admin.email ?? "",
        },
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId ?? "",
        createdAt: log.createdAt.toISOString(),
      }))}
      actionOptions={actionOptions}
      adminOptions={admins}
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
