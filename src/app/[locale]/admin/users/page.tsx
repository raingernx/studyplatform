import { Input } from "@/design-system";
import { Button } from "@/design-system";
import { formatNumber, formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getAdminUsersPageData } from "@/services/admin-operations.service";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Users – Admin",
  description: "Manage platform users.",
};

interface AdminUsersPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdminSession(routes.adminUsers);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q?.trim() ?? "";

  const users = await getAdminUsersPageData({ query });

  return (
    <div className="min-w-0 space-y-6">
      {/* Header + search */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Users
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Manage platform users
          </p>
        </div>

        <form className="w-full max-w-xs">
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or email…"
          />
        </form>
      </div>

      {/* Users table */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-5 py-3 font-medium text-text-secondary">User</th>
                <th className="px-3 py-3 font-medium text-text-secondary">Email</th>
                <th className="px-3 py-3 font-medium text-text-secondary">Role</th>
                <th className="px-3 py-3 font-medium text-text-secondary">Resources</th>
                <th className="px-3 py-3 font-medium text-text-secondary">Joined</th>
                <th className="px-3 py-3 text-right font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-6 text-center text-sm text-text-muted"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="bg-white">
                    <td className="px-5 py-3 text-sm font-medium text-text-primary">
                      {user.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize " +
                          (user.role === "ADMIN"
                            ? "bg-violet-50 text-violet-700"
                            : user.role === "INSTRUCTOR"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-zinc-100 text-zinc-600")
                        }
                      >
                        {user.role === "ADMIN"
                          ? "Admin"
                          : user.role === "INSTRUCTOR"
                          ? "Creator"
                          : "User"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary tabular-nums">
                      {formatNumber(user._count.resources)}
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" type="button">
                          View
                        </Button>
                        <Button variant="outline" size="sm" type="button">
                          Suspend
                        </Button>
                        <Button variant="outline" size="sm" type="button">
                          Delete
                        </Button>
                      </div>
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
