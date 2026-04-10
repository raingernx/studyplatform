import Link from "next/link";
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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/design-system";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CreatorResourceStatusButton } from "@/components/creator/CreatorResourceStatusButton";
import { CreatorWelcomeCard } from "@/components/creator/CreatorWelcomeCard";
import { CreatorSetupChecklist } from "@/components/creator/CreatorSetupChecklist";
import { CreatorQuickTipsCard } from "@/components/creator/CreatorQuickTipsCard";
import { CreatorDraftBanner } from "@/components/creator/CreatorDraftBanner";
import { CreatorFirstSaleBanner } from "@/components/creator/CreatorFirstSaleBanner";
import { CreatorRecentSalesCard } from "@/components/creator/CreatorRecentSalesCard";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import {
  getCreatorBalance,
  getCreatorDashboardPerformance,
  getCreatorDashboardStats,
  getCreatorMostRecentDraft,
  getCreatorRecentSalesForDashboard,
  getCreatorResourceStatusSummary,
  getCreatorSetupState,
} from "@/services/creator";
import { logActivity } from "@/lib/activity";
import { getCreatorProtectedUserContext } from "./creatorProtectedUser";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";

export const metadata = {
  title: "Creator Dashboard",
};

export const dynamic = "force-dynamic";

const PANEL_CLASS = "rounded-2xl border border-border bg-card shadow-card";
const PANEL_HEADER_CLASS =
  "flex flex-col gap-2 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between";
const PANEL_TITLE_CLASS = "text-sm font-semibold text-foreground";
const PANEL_DESCRIPTION_CLASS = "mt-1 text-xs text-muted-foreground";
const TABLE_HEAD_CLASS =
  "border-b border-border/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const TABLE_BODY_CLASS = "divide-y divide-border/60";

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
  const { userId, userName } = await getCreatorProtectedUserContext(routes.creatorDashboard);
  const setupState = await getCreatorSetupState(userId);

  if (setupState.isFirstRun) {
    void logActivity({
      userId,
      action: "creator_dashboard_first_run_view",
      entity: "creator",
      entityId: userId,
      metadata: {
        profileComplete: setupState.steps.profileComplete,
        firstResourceCreated: setupState.steps.firstResourceCreated,
      },
    });

    return (
      <DashboardPageShell routeReady="dashboard-creator-overview">
        <DashboardPageHeader
          eyebrow="Creator"
          title="Creator Dashboard"
          description="Review the resources you own in the marketplace. This dashboard is read-only and shows only listings attached to your account."
        />

        <CreatorWelcomeCard creatorName={userName} canCreate />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <CreatorSetupChecklist steps={setupState.steps} canCreate />
          <CreatorQuickTipsCard />
        </div>
      </DashboardPageShell>
    );
  }

  const statsPromise = getCreatorDashboardStats(userId);
  const performancePromise = getCreatorDashboardPerformance(userId);
  const balancePromise = getCreatorBalance(userId);
  const statusSummaryPromise = getCreatorResourceStatusSummary(userId);
  const mostRecentDraftPromise = getCreatorMostRecentDraft(userId);
  const recentSalesPromise = getCreatorRecentSalesForDashboard(userId);
  const overviewResults = await CreatorDashboardOverviewResultsSection({
    statsPromise,
    performancePromise,
    balancePromise,
    statusSummaryPromise,
    mostRecentDraftPromise,
    recentSalesPromise,
  });

  return (
    <DashboardPageShell routeReady="dashboard-creator-overview">
      <DashboardPageHeader
        eyebrow="Creator"
        title="Creator Dashboard"
        description="Review the resources you own in the marketplace. This dashboard is read-only and shows only listings attached to your account."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={routes.creatorResources}>Open resource manager</Link>
            </Button>
            <Button asChild>
              <Link href={routes.creatorNewResource}>
                <Plus className="h-4 w-4" />
                Create resource
              </Link>
            </Button>
          </div>
        }
      />
      {overviewResults}
    </DashboardPageShell>
  );
}

async function CreatorDashboardOverviewResultsSection({
  statsPromise,
  performancePromise,
  balancePromise,
  statusSummaryPromise,
  mostRecentDraftPromise,
  recentSalesPromise,
}: {
  statsPromise: ReturnType<typeof getCreatorDashboardStats>;
  performancePromise: ReturnType<typeof getCreatorDashboardPerformance>;
  balancePromise: ReturnType<typeof getCreatorBalance>;
  statusSummaryPromise: ReturnType<typeof getCreatorResourceStatusSummary>;
  mostRecentDraftPromise: ReturnType<typeof getCreatorMostRecentDraft>;
  recentSalesPromise: ReturnType<typeof getCreatorRecentSalesForDashboard>;
}) {
  const [stats, performance, balance, statusSummary, mostRecentDraft, recentSales] =
    await Promise.all([
      statsPromise,
      performancePromise,
      balancePromise,
      statusSummaryPromise,
      mostRecentDraftPromise,
      recentSalesPromise,
    ]);

  const lifecycleMessage =
    stats.totalResources === 0
      ? null
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
    <DashboardPageStack>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4 text-success-600" />
              Total revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {formatPrice(stats.totalRevenue / 100)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed purchase revenue using purchase-time author snapshots.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShoppingBag className="h-4 w-4 text-info-600" />
              Total sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {stats.totalSales.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed purchases across all resources you currently own.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4 text-primary-700" />
              Total resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {stats.totalResources}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {statusSummary.published} published · {statusSummary.draft} draft ·{" "}
              {statusSummary.archived} archived
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {statusSummary.draft}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Private and not purchasable.</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {statusSummary.published}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Visible in the marketplace and sellable.</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {statusSummary.archived}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Hidden from listings until restored.</p>
          </CardContent>
        </Card>
      </div>

      <CreatorFirstSaleBanner totalSales={stats.totalSales} />

      {mostRecentDraft && (
        <CreatorDraftBanner
          draft={mostRecentDraft}
          totalDrafts={statusSummary.draft}
        />
      )}

      {lifecycleMessage && (
        <div className="rounded-2xl border border-info-100 bg-info-50 px-5 py-4 text-sm text-info-700">
          <p className="font-semibold">{lifecycleMessage.title}</p>
          <p className="mt-1">{lifecycleMessage.description}</p>
        </div>
      )}

      <CreatorRecentSalesCard sales={recentSales} />

      {topPerformer && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-success-100 bg-success-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success-700">
              Best performing resource
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-success-700">{topPerformer.title}</p>
                <p className="mt-1 text-sm text-success-700">
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

          <div className="rounded-2xl border border-warning-100 bg-warning-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning-700">
              Creator momentum
            </p>
            {momentumMilestones.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {momentumMilestones.map((milestone) => (
                  <Badge
                    key={milestone}
                    variant="warning"
                    className="bg-background px-3 py-1 font-semibold text-warning-700 ring-1 ring-inset ring-warning-200"
                  >
                    {milestone}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-warning-700">
                Your next milestone is close. A few more downloads, sales, or visible reviews will
                make this listing stand out faster.
              </p>
            )}
            {qualityFeedback && (
              <p className="mt-3 text-sm text-warning-700">{qualityFeedback}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4 text-success-600" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Available balance
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {formatPrice(balance.availableBalance / 100)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Read-only payout-ready balance based on purchase earnings minus recorded payouts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-muted px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total earnings</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatPrice(balance.totalEarnings / 100)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total paid out</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatPrice(balance.totalPayouts / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-sm font-medium text-muted-foreground">
              <span>Payout history</span>
              <Button type="button" variant="outline" size="sm" disabled>
                Request payout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balance.payouts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
                No payouts recorded yet. This account is payout-ready, but payout execution has not
                been enabled.
              </div>
            ) : (
              <ul className="space-y-3">
                {balance.payouts.slice(0, 5).map((payout) => (
                  <li
                    key={payout.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatPrice(payout.amount / 100)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(payout.createdAt)}</p>
                    </div>
                    <Badge variant="neutral" className="px-2.5 py-1 text-[11px] uppercase tracking-wide">
                      {payout.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section className={PANEL_CLASS}>
        <div className={PANEL_HEADER_CLASS}>
          <div>
            <h2 className={PANEL_TITLE_CLASS}>Resource performance</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
              Revenue and sales reflect completed purchases with available author snapshot data.
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {performance.length} resource{performance.length === 1 ? "" : "s"}
          </p>
        </div>

        {performance.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm font-semibold text-foreground">
              You have not created any resources yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start your creator catalog by adding your first marketplace listing.
            </p>
            <Button className="mt-6" asChild>
              <Link href={routes.creatorNewResource}>
                <Plus className="h-4 w-4" />
                Create your first resource
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className={TABLE_HEAD_CLASS}>
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
              <tbody className={TABLE_BODY_CLASS}>
                {performance.map((resource) => (
                  <tr key={resource.resourceId} className="hover:bg-muted/60">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{resource.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{resource.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={resource.status} />
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                      {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        {resource.downloadCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                      {resource.salesCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-muted-foreground">
                      {typeof resource.averageRating === "number" &&
                      resource.visibleReviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
                          {resource.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-foreground">
                      {formatPrice(resource.revenue / 100)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(resource.createdAt)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(resource.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <ResourceIntentLink href={routes.resource(resource.slug)}>
                            <ExternalLink className="h-4 w-4" />
                            View listing
                          </ResourceIntentLink>
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
    </DashboardPageStack>
  );
}
