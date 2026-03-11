import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Analytics – Admin",
  description: "Marketplace analytics and trends.",
};

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/analytics");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          High-level metrics and trends for your marketplace.
        </p>
      </div>

      {/* Stats overview (placeholder numbers) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            Total revenue
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            ฿0
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            Downloads
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            0
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            New users
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            0
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            New resources
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            0
          </p>
        </Card>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue line chart placeholder */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Revenue (last 30 days)
              </h2>
              <p className="text-xs text-text-muted">
                Placeholder line chart – data coming soon.
              </p>
            </div>
          </div>
          <div className="mt-2 h-56 rounded-xl border border-dashed border-border-subtle bg-surface-50" />
        </Card>

        {/* Downloads bar chart placeholder */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Downloads by day
              </h2>
              <p className="text-xs text-text-muted">
                Placeholder bar chart – data coming soon.
              </p>
            </div>
          </div>
          <div className="mt-2 h-56 rounded-xl border border-dashed border-border-subtle bg-surface-50" />
        </Card>

        {/* New users chart placeholder */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                New users
              </h2>
              <p className="text-xs text-text-muted">
                Placeholder chart for signups.
              </p>
            </div>
          </div>
          <div className="mt-2 h-56 rounded-xl border border-dashed border-border-subtle bg-surface-50" />
        </Card>

        {/* Top resources chart placeholder */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Top resources
              </h2>
              <p className="text-xs text-text-muted">
                Placeholder chart for best-performing resources.
              </p>
            </div>
          </div>
          <div className="mt-2 h-56 rounded-xl border border-dashed border-border-subtle bg-surface-50" />
        </Card>
      </div>
    </div>
  );
}

