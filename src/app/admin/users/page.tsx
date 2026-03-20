import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Input, Button, RowActionButton, RowActions } from "@/design-system";
import { formatNumber, formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata = {
  title: "Users – Admin",
  description: "Manage platform users.",
};

interface AdminUsersPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/users");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = resolvedSearchParams.q?.trim() ?? "";

  const users = await prisma.user.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { resources: true } },
    },
  });

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Users"
        description="Manage platform users."
      />

      {/* Search filter shell */}
      <form className="flex min-w-0 flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-white px-4 py-3 shadow-card">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <label
            htmlFor="q"
            className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
          >
            Search
          </label>
          <Input
            id="q"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or email…"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {/* Users table */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface-50/80">
              <tr>
                <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">User</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Email</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Role</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Resources</th>
                <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Joined</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">
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
                  <tr key={user.id} className="bg-white transition-colors hover:bg-surface-50">
                    <td className="px-2 py-3 text-sm font-medium text-text-primary">
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
                      <RowActions>
                        <RowActionButton type="button">
                          View
                        </RowActionButton>
                        <RowActionButton type="button" tone="muted">
                          Suspend
                        </RowActionButton>
                        <RowActionButton type="button" tone="danger">
                          Delete
                        </RowActionButton>
                      </RowActions>
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
