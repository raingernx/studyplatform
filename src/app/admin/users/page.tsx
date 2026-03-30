import { Search } from "lucide-react";
import { Input, Button, RowActionButton, RowActions } from "@/design-system";
import { formatNumber, formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
  TableToolbar,
} from "@/components/admin/table";
import { getAdminUsersPageData } from "@/services/admin-operations.service";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Users – Admin",
  description: "Manage platform users.",
};

interface AdminUsersPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q?.trim() ?? "";

  return withRequestPerformanceTrace(
    "route:/admin/users",
    {
      hasQuery: Boolean(query),
    },
    async () => {
      await traceServerStep(
        "admin_users.requireAdminSession",
        () => requireAdminSession(routes.adminUsers),
      );

      const users = await traceServerStep(
        "admin_users.getAdminUsersPageData",
        () => getAdminUsersPageData({ query }),
        { hasQuery: Boolean(query) },
      );

      return (
        <div className="min-w-0 space-y-7">
          <AdminPageHeader title="Users" description="Manage platform users." />

          <form>
            <TableToolbar className="gap-2.5">
              <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                <label htmlFor="q" className="font-ui text-caption text-text-muted">
                  Search
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Search className="h-4 w-4 text-text-muted" />
                  </span>
                  <Input
                    id="q"
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search by name or email…"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" size="sm" className="self-end">
                Search
              </Button>
            </TableToolbar>
          </form>

          <DataTable minWidth="min-w-[720px]">
            <DataTableHeader>
              <tr>
                <DataTableHeadCell>User</DataTableHeadCell>
                <DataTableHeadCell>Email</DataTableHeadCell>
                <DataTableHeadCell>Role</DataTableHeadCell>
                <DataTableHeadCell>Resources</DataTableHeadCell>
                <DataTableHeadCell>Joined</DataTableHeadCell>
                <DataTableHeadCell align="right">Actions</DataTableHeadCell>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {users.length === 0 ? (
                <TableEmptyState message="No users found." />
              ) : (
                users.map((user) => (
                  <DataTableRow key={user.id}>
                    <DataTableCell className="font-medium">{user.name ?? "—"}</DataTableCell>
                    <DataTableCell className="text-text-secondary">
                      {user.email ?? "—"}
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge
                        status={user.role}
                        label={
                          user.role === "ADMIN"
                            ? "Admin"
                            : user.role === "INSTRUCTOR"
                              ? "Creator"
                              : "User"
                        }
                        tone={
                          user.role === "ADMIN"
                            ? "accent"
                            : user.role === "INSTRUCTOR"
                              ? "info"
                              : "muted"
                        }
                      />
                    </DataTableCell>
                    <DataTableCell className="tabular-nums text-text-secondary">
                      {formatNumber(user._count.resources)}
                    </DataTableCell>
                    <DataTableCell className="text-text-secondary">
                      {formatDate(user.createdAt)}
                    </DataTableCell>
                    <DataTableCell align="right">
                      <RowActions>
                        <RowActionButton type="button">View</RowActionButton>
                        <RowActionButton type="button" tone="muted">
                          Suspend
                        </RowActionButton>
                        <RowActionButton type="button" tone="danger">
                          Delete
                        </RowActionButton>
                      </RowActions>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        </div>
      );
    },
  );
}
