"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button, Input, Select } from "@/design-system";
import { formatDate } from "@/lib/format";

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
    router.push(`/admin/audit${qs ? `?${qs}` : ""}`);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    updateQuery({ page: nextPage });
  }

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-surface-200 pb-4">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Audit Trail
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Monitor important admin actions across the platform.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex min-w-0 flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-white px-4 py-3 shadow-card">
        <div className="w-full max-w-xs space-y-1.5">
          <label
            htmlFor="actionFilter"
            className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
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
            className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
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
              className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
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
              className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
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
      </div>

      {/* Table */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Admin
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Action
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Entity
                </th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-text-secondary"
                  >
                    No audit events found for the current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white transition-colors hover:bg-surface-50"
                  >
                    <td className="px-2 py-3 align-middle">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {item.admin.name}
                        </p>
                        {item.admin.email && (
                          <p className="truncate text-xs text-text-muted">
                            {item.admin.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-sm text-text-secondary">
                      {item.action}
                    </td>
                    <td className="px-3 py-3 align-middle text-sm text-text-secondary">
                      {item.entityType}
                      {item.entityId && ` #${item.entityId}`}
                    </td>
                    <td className="px-3 py-3 align-middle text-sm text-text-secondary">
                      {formatDate(new Date(item.createdAt))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface-50/60 px-4 py-3 text-xs text-text-secondary">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
