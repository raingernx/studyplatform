"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Input, Select } from "@/design-system";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
  TablePagination,
  TableToolbar,
} from "@/components/admin/table";

interface AuditTrailItem {
  id: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string; // ISO string
}

interface AuditTrailClientProps {
  items: AuditTrailItem[];
  actionOptions: string[];
  adminOptions: { id: string; name: string | null; email: string | null }[];
  pagination: {
    page: number;
    totalPages: number;
  };
  initialFilters: {
    action: string;
    adminId: string;
    from: string;
    to: string;
  };
}

export function AuditTrailClient({
  items,
  actionOptions,
  adminOptions,
  pagination,
  initialFilters,
}: AuditTrailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = pagination.page;
  const totalPages = pagination.totalPages;

  function updateQuery(next: Partial<{ page: number; action: string; adminId: string; from: string; to: string }>) {
    const params = new URLSearchParams(searchParams ?? undefined);

    if (next.page !== undefined) {
      if (next.page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(next.page));
      }
    }

    if (next.action !== undefined) {
      if (!next.action || next.action === "all") {
        params.delete("action");
      } else {
        params.set("action", next.action);
      }
      // Reset page when filters change
      params.delete("page");
    }

    if (next.adminId !== undefined) {
      if (!next.adminId || next.adminId === "all") {
        params.delete("adminId");
      } else {
        params.set("adminId", next.adminId);
      }
      params.delete("page");
    }

    if (next.from !== undefined) {
      if (!next.from) {
        params.delete("from");
      } else {
        params.set("from", next.from);
      }
      params.delete("page");
    }

    if (next.to !== undefined) {
      if (!next.to) {
        params.delete("to");
      } else {
        params.set("to", next.to);
      }
      params.delete("page");
    }

    const qs = params.toString();
    router.push(routes.adminAuditQuery(qs));
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    updateQuery({ page: nextPage });
  }

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Audit Trail"
        description="Monitor important admin actions across the platform."
      />

      {/* Filters */}
      <TableToolbar>
        <div className="w-full max-w-xs space-y-1.5">
          <label
            htmlFor="actionFilter"
            className="font-ui text-caption text-muted-foreground"
          >
            Action type
          </label>
          <Select
            id="actionFilter"
            defaultValue={initialFilters.action || "all"}
            onChange={(e) => updateQuery({ action: e.target.value })}
          >
            <option value="all">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full max-w-xs space-y-1.5">
          <label
            htmlFor="adminFilter"
            className="font-ui text-caption text-muted-foreground"
          >
            Admin
          </label>
          <Select
            id="adminFilter"
            defaultValue={initialFilters.adminId || "all"}
            onChange={(e) => updateQuery({ adminId: e.target.value })}
          >
            <option value="all">All admins</option>
            {adminOptions.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name || admin.email || admin.id}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="from"
              className="font-ui text-caption text-muted-foreground"
            >
              From
            </label>
            <Input
              id="from"
              type="date"
              defaultValue={initialFilters.from}
              onChange={(e) => updateQuery({ from: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="to"
              className="font-ui text-caption text-muted-foreground"
            >
              To
            </label>
            <Input
              id="to"
              type="date"
              defaultValue={initialFilters.to}
              onChange={(e) => updateQuery({ to: e.target.value })}
              className="w-40"
            />
          </div>
        </div>
      </TableToolbar>

      {/* Table */}
      <DataTable minWidth="min-w-full">
        <DataTableHeader>
          <tr>
            <DataTableHeadCell className="px-2">
                  Admin
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Action
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Entity
            </DataTableHeadCell>
            <DataTableHeadCell className="px-3">
                  Date
            </DataTableHeadCell>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {items.length === 0 ? (
            <TableEmptyState
              message="No audit events found"
              description="Try widening the date range or clearing the current filters."
            />
          ) : (
            items.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell className="px-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.admin.name}
                    </p>
                    {item.admin.email && (
                      <p className="truncate text-caption text-muted-foreground">
                        {item.admin.email}
                      </p>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell className="px-3 text-muted-foreground">
                  {item.action}
                </DataTableCell>
                <DataTableCell className="px-3 text-muted-foreground">
                  {item.entityType}
                  {item.entityId && ` #${item.entityId}`}
                </DataTableCell>
                <DataTableCell className="px-3 text-muted-foreground">
                  {formatDate(new Date(item.createdAt))}
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
        <TablePagination
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="px-4 py-2.5"
        />
      </DataTable>
    </div>
  );
}
