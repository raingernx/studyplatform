import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowUpRight,
  DollarSign,
  ExternalLink,
  FileText,
  FolderOpen,
  Download,
  Plus,
  ShoppingBag,
  Star,
  Wallet,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import { authOptions } from "@/lib/auth";
import { CreatorResourceStatusButton } from "@/components/creator/CreatorResourceStatusButton";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getCreatorAccessState,
  getCreatorBalance,
  getCreatorDashboardPerformance,
  getCreatorDashboardStats,
  getCreatorResourceStatusSummary,
} from "@/services/creator.service";

export const metadata = {
  title: "Creator Dashboard",
};

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "ARCHIVED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-neutral-50 text-neutral-600 ring-neutral-200";
  }
}

function buildMomentumMilestones(resource: {
  downloadCount: number;
  salesCount: number;
  averageRating: number | null;
  visibleReviewCount: number;
}) {
  const milestones: string[] = [];

  if (resource.downloadCount >= 100) {
    milestones.push("100+ downloads");
  }

  if (resource.salesCount >= 10) {
    milestones.push("10+ sales");
  }

  if (
    typeof resource.averageRating === "number" &&
    resource.averageRating >= 4.5 &&
    resource.visibleReviewCount >= 5
  ) {
    milestones.push("4.5★+ public rating");
  }

  return milestones;
}

function buildQualityFeedback(resource: {
  salesCount: number;
  downloadCount: number;
  averageRating: number | null;
  visibleReviewCount: number;
}) {
  if (resource.visibleReviewCount === 0) {
    return "Your next visible review will strengthen marketplace trust signals on cards, rankings, and the listing page.";
  }

  if (
    typeof resource.averageRating === "number" &&
    resource.averageRating >= 4.5 &&
    resource.visibleReviewCount >= 5
  ) {
    return "Strong public ratings are helping this listing convert. Keep the preview, title, and file quality aligned with what buyers already like.";
  }

  if (resource.downloadCount > resource.salesCount * 5) {
    return "Interest is outpacing conversions. Tightening the cover, title, and description is the fastest way to turn more visits into purchases.";
  }

  return "Review quality, downloads, and sales are moving together. Small listing improvements here should compound across discovery and conversion surfaces.";
}

export default async function CreatorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const [stats, performance, balance, statusSummary] = await Promise.all([
    getCreatorDashboardStats(session.user.id),
    getCreatorDashboardPerformance(session.user.id),
    getCreatorBalance(session.user.id),
    getCreatorResourceStatusSummary(session.user.id),
  ]);
  const lifecycleMessage =
    stats.totalResources === 0
      ? null
      : statusSummary.published === 0 && statusSummary.draft > 0
        ? {
            title: "You have drafts waiting to be published",
            description:
              "Draft resources stay private and cannot be sold. Publish one when the file, title, description, and slug are ready.",
          }
        : statusSummary.published > 0 && stats.totalSales === 0
          ? {
              title: "Your resources are live",
              description:
                "Published resources are visible in the marketplace. Share or refine your listings to start generating sales.",
            }
          : null;
  const topPerformer = performance[0] ?? null;
  const momentumMilestones = topPerformer ? buildMomentumMilestones(topPerformer) : [];
  const qualityFeedback = topPerformer ? buildQualityFeedback(topPerformer) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
            Creator
          </p>
          <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-neutral-900">
            Creator Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Review the resources you own in the marketplace. This dashboard is read-only and
            shows only listings attached to your account.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={routes.creatorResources}>Open resource manager</Link>
          </Button>
          {access.canCreate && (
            <Button asChild>
              <Link href={routes.creatorNewResource}>
                <Plus className="h-4 w-4" />
                Create resource
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-neutral-900">
              {formatPrice(stats.totalRevenue / 100)}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Completed purchase revenue using purchase-time author snapshots.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Total sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-neutral-900">
              {stats.totalSales.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Completed purchases across all resources you currently own.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <FileText className="h-4 w-4 text-violet-600" />
              Total resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-neutral-900">
              {stats.totalResources}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {statusSummary.published} published · {statusSummary.draft} draft ·{" "}
              {statusSummary.archived} archived
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900">
              {statusSummary.draft}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Private and not purchasable.</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900">
              {statusSummary.published}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Visible in the marketplace and sellable.</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900">
              {statusSummary.archived}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Hidden from listings until restored.</p>
          </CardContent>
        </Card>
      </div>

      {lifecycleMessage && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
          <p className="font-semibold">{lifecycleMessage.title}</p>
          <p className="mt-1">{lifecycleMessage.description}</p>
        </div>
      )}

      {topPerformer && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Best performing resource
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">{topPerformer.title}</p>
                <p className="mt-1 text-sm text-emerald-700">
                  {topPerformer.salesCount.toLocaleString()} sales ·{" "}
                  {topPerformer.downloadCount.toLocaleString()} downloads
                  {typeof topPerformer.averageRating === "number" &&
                  topPerformer.visibleReviewCount > 0
                    ? ` · ${topPerformer.averageRating.toFixed(1)}★ from ${topPerformer.visibleReviewCount} reviews`
                    : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.creatorResource(topPerformer.resourceId)}>
                  Improve listing
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Creator momentum
            </p>
            {momentumMilestones.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {momentumMilestones.map((milestone) => (
                  <span
                    key={milestone}
                    className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200"
                  >
                    {milestone}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-800">
                Your next milestone is close. A few more downloads, sales, or visible reviews will
                make this listing stand out faster.
              </p>
            )}
            {qualityFeedback && (
              <p className="mt-3 text-sm text-amber-800">{qualityFeedback}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <Wallet className="h-4 w-4 text-emerald-600" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Available balance
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
                {formatPrice(balance.availableBalance / 100)}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Read-only payout-ready balance based on purchase earnings minus recorded payouts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Total earnings</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {formatPrice(balance.totalEarnings / 100)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Total paid out</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {formatPrice(balance.totalPayouts / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-600">
              <span>Payout history</span>
              <Button type="button" variant="outline" size="sm" disabled>
                Request payout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balance.payouts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                No payouts recorded yet. This account is payout-ready, but payout execution has not
                been enabled.
              </div>
            ) : (
              <ul className="space-y-3">
                {balance.payouts.slice(0, 5).map((payout) => (
                  <li
                    key={payout.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {formatPrice(payout.amount / 100)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">{formatDate(payout.createdAt)}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                      {payout.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card">
        <div className="flex flex-col gap-2 border-b border-neutral-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Resource performance</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Revenue and sales reflect completed purchases with available author snapshot data.
            </p>
          </div>
          <p className="text-xs font-medium text-neutral-400">
            {performance.length} resource{performance.length === 1 ? "" : "s"}
          </p>
        </div>

        {performance.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-4 text-sm font-semibold text-neutral-700">
              You have not created any resources yet
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Start your creator catalog by adding your first marketplace listing.
            </p>
            {access.canCreate && (
              <Button className="mt-6" asChild>
                <Link href={routes.creatorNewResource}>
                  <Plus className="h-4 w-4" />
                  Create your first resource
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Downloads</th>
                  <th className="px-4 py-3 text-right">Sales</th>
                  <th className="px-4 py-3 text-right">Rating</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-6 py-3 text-right">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {performance.map((resource) => (
                  <tr key={resource.resourceId} className="hover:bg-neutral-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900">{resource.title}</p>
                          <p className="mt-1 text-xs text-neutral-400">{resource.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusTone(resource.status)}`}
                      >
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-neutral-700">
                      {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-neutral-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5 text-neutral-400" />
                        {resource.downloadCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-neutral-700">
                      {resource.salesCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-neutral-700">
                      {typeof resource.averageRating === "number" &&
                      resource.visibleReviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {resource.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-neutral-900">
                      {formatPrice(resource.revenue / 100)}
                    </td>
                    <td className="px-4 py-4 text-neutral-500">{formatDate(resource.createdAt)}</td>
                    <td className="px-4 py-4 text-neutral-500">{formatDate(resource.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={routes.resource(resource.slug)}>
                            <ExternalLink className="h-4 w-4" />
                            View listing
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={routes.creatorResource(resource.resourceId)}>
                            Edit
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <CreatorResourceStatusButton
                          resourceId={resource.resourceId}
                          status={resource.status as "DRAFT" | "PUBLISHED" | "ARCHIVED"}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
