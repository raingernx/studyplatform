import { Suspense, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownToLine,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Grid2X2,
  PackagePlus,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Store,
  UploadCloud,
} from "lucide-react";

import {
  Avatar,
  Badge,
  Button,
  buildPaginationItems,
  Card,
  CardContent,
  DataPanelTable,
  EmptyState,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
  PaginationEllipsis,
  PaginationInfo,
  PaginationList,
  PaginationNav,
  ResourceCard,
  SearchInput,
} from "@/design-system";
import { CreatorProfileForm } from "@/components/creator/CreatorProfileForm";
import { CreatorResourceForm } from "@/components/creator/CreatorResourceForm";
import {
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PreferenceSettings } from "@/components/settings/PreferenceSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DashboardV2CreatorInventoryFilters } from "@/components/dashboard-v2/DashboardV2CreatorInventoryFilters";
import { DashboardV2MembershipActions } from "@/components/dashboard-v2/DashboardV2MembershipActions";
import type {
  DashboardV2HomeActivityItem,
  DashboardV2HomeContinueLearningItem,
  DashboardV2HomeData,
  DashboardV2HomeMembershipSnapshot,
  DashboardV2HomeSurfaceState,
  DashboardV2HomeStatItem,
  DashboardV2HomeStatKey,
} from "@/services/dashboard-v2/home.service";
import type {
  DashboardV2DownloadsData,
} from "@/services/dashboard-v2/downloads.service";
import { formatDashboardV2DownloadFileSize } from "@/services/dashboard-v2/downloads.service";
import type { DashboardV2MembershipData } from "@/services/dashboard-v2/membership.service";
import type { DashboardV2PurchasesData } from "@/services/dashboard-v2/purchases.service";
import { getDashboardV2PurchaseReference } from "@/services/dashboard-v2/purchases.service";
import type { DashboardV2SettingsData } from "@/services/dashboard-v2/settings.service";
import type {
  DashboardV2CreatorOverviewData,
  DashboardV2CreatorStatItem,
} from "@/services/dashboard-v2/creator-overview.service";
import type {
  DashboardV2CreatorResourcesData,
  DashboardV2CreatorResourcePricingFilter,
  DashboardV2CreatorResourceStatusFilter,
} from "@/services/dashboard-v2/creator-resources.service";
import { getDashboardV2CreatorResourcesHref } from "@/services/dashboard-v2/creator-resources.service";
import type { DashboardV2CreatorAnalyticsData } from "@/services/dashboard-v2/creator-analytics.service";
import type {
  DashboardV2CreatorEarningsData,
} from "@/services/dashboard-v2/creator-earnings.service";
import type { DashboardV2CreatorEditorData } from "@/services/dashboard-v2/creator-editor.service";
import type { DashboardV2CreatorProfileData } from "@/services/dashboard-v2/creator-profile.service";
import type {
  DashboardV2LibraryData,
  DashboardV2LibraryFilterKey,
} from "@/services/dashboard-v2/library.service";
import { getDashboardV2LibraryHref } from "@/services/dashboard-v2/library.service";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

type Stat = {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName?: string;
  iconClassName?: string;
};

type Resource = {
  title: string;
  meta: string;
  status: "Ready" | "Updated" | "Draft";
  pages: string;
};

type Activity = {
  title: string;
  detail: string;
  time: string;
  icon: ComponentType<{ className?: string }>;
};

type DashboardV2CreatorReadyData = Extract<
  DashboardV2CreatorOverviewData,
  { state: "ready" }
>;

const userStats: Stat[] = [
  {
    label: "Owned resources",
    value: "24",
    detail: "6 opened this week",
    icon: BookOpen,
  },
  {
    label: "Downloads",
    value: "118",
    detail: "Protected delivery healthy",
    icon: ArrowDownToLine,
  },
  {
    label: "Purchases",
    value: "$284",
    detail: "Lifetime learning spend",
    icon: ReceiptText,
  },
  {
    label: "Membership",
    value: "Free",
    detail: "Upgrade path ready",
    icon: ShieldCheck,
  },
];

const creatorStats: Stat[] = [
  {
    label: "Revenue",
    value: "$1,248",
    detail: "+12.4% over 30 days",
    icon: CircleDollarSign,
    accentClassName: "border-[hsl(var(--primary)/0.24)]",
    iconClassName:
      "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]",
  },
  {
    label: "Published resources",
    value: "18",
    detail: "3 drafts need review",
    icon: FileText,
    accentClassName: "border-[hsl(var(--chart-2)/0.24)]",
    iconClassName:
      "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]",
  },
  {
    label: "Downloads",
    value: "2,913",
    detail: "Science packs leading",
    icon: ArrowDownToLine,
    accentClassName: "border-[hsl(var(--chart-5)/0.24)]",
    iconClassName:
      "bg-[hsl(var(--chart-5)/0.12)] text-[hsl(var(--chart-5))]",
  },
];

const creatorWorkspaceLinks = [
  {
    title: "Resources",
    detail: "Manage catalog",
    href: routes.dashboardV2CreatorResources,
    icon: FileText,
  },
  {
    title: "Earnings",
    detail: "Sales and payouts",
    href: routes.dashboardV2CreatorSales,
    icon: CircleDollarSign,
  },
  {
    title: "Analytics",
    detail: "Full report",
    href: routes.dashboardV2CreatorAnalytics,
    icon: BarChart3,
  },
  {
    title: "Storefront",
    detail: "Preview your public storefront",
    href: routes.dashboardV2CreatorProfile,
    icon: Store,
  },
] as const;

const creatorStatToneByKey: Record<
  DashboardV2CreatorStatItem["key"],
  Pick<Stat, "icon" | "accentClassName" | "iconClassName">
> = {
  revenue: {
    icon: CircleDollarSign,
    accentClassName: "border-[hsl(var(--primary)/0.24)]",
    iconClassName:
      "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]",
  },
  resources: {
    icon: FileText,
    accentClassName: "border-[hsl(var(--chart-2)/0.24)]",
    iconClassName:
      "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]",
  },
  downloads: {
    icon: ArrowDownToLine,
    accentClassName: "border-[hsl(var(--chart-5)/0.24)]",
    iconClassName:
      "bg-[hsl(var(--chart-5)/0.12)] text-[hsl(var(--chart-5))]",
  },
};

const creatorWorkspaceLinkIconByKey: Record<
  DashboardV2CreatorReadyData["links"][number]["key"],
  ComponentType<{ className?: string }>
> = {
  resources: FileText,
  earnings: CircleDollarSign,
  analytics: BarChart3,
  storefront: Store,
};

const resources: Resource[] = [
  {
    title: "Middle School Science Quiz Set",
    meta: "Assessment pack · Grades 6-8",
    status: "Ready",
    pages: "42 pages",
  },
  {
    title: "Essential Vocabulary Flashcards",
    meta: "Flashcards · English",
    status: "Updated",
    pages: "500 cards",
  },
  {
    title: "Geometry Practice Workbook",
    meta: "Worksheet · Math",
    status: "Ready",
    pages: "28 pages",
  },
];

const activities: Activity[] = [
  {
    title: "Science Quiz Set downloaded",
    detail: "Protected link issued successfully",
    time: "8 min ago",
    icon: ArrowDownToLine,
  },
  {
    title: "Vocabulary Flashcards updated",
    detail: "New version available in Library",
    time: "2 hr ago",
    icon: CheckCircle2,
  },
  {
    title: "Creator resource moved to review",
    detail: "Geometry Practice Workbook",
    time: "Yesterday",
    icon: Clock3,
  },
];

const creatorResources = [
  {
    title: "Biology Lab Safety Posters",
    status: "Published",
    sales: "$426",
    downloads: "812",
  },
  {
    title: "Fractions Intervention Pack",
    status: "Draft",
    sales: "$0",
    downloads: "0",
  },
  {
    title: "Reading Fluency Tracker",
    status: "Review",
    sales: "$118",
    downloads: "164",
  },
];

const DASHBOARD_V2_CREATOR_RESOURCE_STATUS_FILTERS: {
  key: DashboardV2CreatorResourceStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "All status" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
  { key: "ARCHIVED", label: "Archived" },
];

const DASHBOARD_V2_CREATOR_RESOURCE_PRICING_FILTERS: {
  key: DashboardV2CreatorResourcePricingFilter;
  label: string;
}[] = [
  { key: "all", label: "All pricing" },
  { key: "paid", label: "Paid" },
  { key: "free", label: "Free" },
];

const DASHBOARD_V2_CREATOR_RESOURCE_SORTS = [
  { key: "latest", label: "Latest" },
  { key: "downloads", label: "Downloads" },
  { key: "revenue", label: "Revenue" },
] as const;

type RouteIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "info" | "featured" | "warning";
  action?: ReactNode;
};

function DashboardV2RouteIntro({
  eyebrow,
  title,
  description,
  tone = "info",
  action,
}: RouteIntroProps) {
  return (
    <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant={tone}>{eyebrow}</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}

export function DashboardV2PageIntro({
  showContractLink = false,
}: {
  showContractLink?: boolean;
}) {
  return (
    <section className="grid gap-6 border-b border-border-subtle pb-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
      <div className="max-w-3xl">
        <Badge variant="info">Isolated route family</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground sm:text-4xl">
          Dashboard V2 rebuild, designed around one shell and predictable
          loading.
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
          This isolated dashboard family proves the product structure before any
          production dashboard migration. The shell is stable; pages only own
          their content.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-card p-4">
        <div className="grid gap-3 text-sm">
          {[
            ["Shell", "Sidebar, topbar, viewport"],
            ["Pages", "Content, states, local fallbacks"],
            ["Loading", "First-entry shell, then content-only"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-border-subtle pb-3 last:border-0 last:pb-0"
            >
              <span className="font-medium text-foreground">{label}</span>
              <span className="text-right text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {showContractLink ? (
            <Button asChild variant="secondary">
              <Link href="#dashboard-contract">
                <Grid2X2 className="size-4" aria-hidden />
                Review contract
              </Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href={routes.dashboardV2Creator}>
              <PackagePlus className="size-4" aria-hidden />
              Prototype next
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function StatGrid({
  columns = "four",
  stats,
}: {
  columns?: "three" | "four";
  stats: Stat[];
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        columns === "three" ? "xl:grid-cols-3" : "xl:grid-cols-4",
      )}
    >
      {stats.map((stat) => (
        <Card
          key={stat.label}
          size="sm"
          className={cn("min-h-32", stat.accentClassName)}
        >
          <CardContent className="flex flex-1 flex-col justify-between py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate whitespace-nowrap text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 font-ui text-3xl font-semibold tabular-nums text-foreground">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground",
                  stat.iconClassName,
                )}
              >
                <stat.icon className="size-4" aria-hidden />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{stat.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardV2UserStats() {
  return <StatGrid stats={userStats} />;
}

function mapCreatorStatItem(stat: DashboardV2CreatorStatItem): Stat {
  return {
    label: stat.label,
    value: stat.value,
    detail: stat.detail,
    ...creatorStatToneByKey[stat.key],
  };
}

export function DashboardV2CreatorStats({
  stats,
}: {
  stats?: DashboardV2CreatorStatItem[];
} = {}) {
  return (
    <StatGrid
      columns="three"
      stats={stats ? stats.map(mapCreatorStatItem) : creatorStats}
    />
  );
}

export function DashboardV2ResourceRail() {
  return (
    <Card id="learning-library">
      <CardHeader className="border-b border-border-subtle pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Continue learning</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Owned resources with stable actions and clear status.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={routes.dashboardV2Library}>
              Library
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 py-4 md:grid-cols-3">
        {resources.map((resource) => (
          <article
            key={resource.title}
            className="rounded-xl border border-border-subtle bg-background p-3"
          >
            <div className="h-28 rounded-lg border border-border-subtle bg-muted/50 p-3">
              <div className="flex h-full flex-col justify-between rounded-md border border-border-subtle bg-card p-3">
                <div className="space-y-2">
                  <div className="h-2 w-16 rounded-full bg-primary opacity-70" />
                  <div className="h-2 w-4/5 rounded-full bg-muted" />
                  <div className="h-2 w-3/5 rounded-full bg-muted" />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <BookOpen
                    className="size-5 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {resource.pages}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {resource.title}
                </h3>
                <Badge
                  variant={resource.status === "Updated" ? "success" : "neutral"}
                >
                  {resource.status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {resource.meta}
              </p>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardV2ActivityPanel() {
  return (
    <Card>
      <CardHeader className="border-b border-border-subtle pb-4">
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border-subtle">
        {activities.map((activity) => (
          <div key={activity.title} className="flex gap-3 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <activity.icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {activity.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {activity.detail}
              </p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              {activity.time}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardV2DownloadsPreview() {
  return (
    <DataPanelTable
      title="Downloads"
      description="Table-first layout for protected file delivery."
      actions={<Badge variant="success">No delivery errors</Badge>}
      bodyClassName="p-0"
      id="downloads"
    >
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Resource</th>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {resources.map((resource, index) => (
                <tr key={resource.title}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {resource.meta}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">PDF pack</td>
                  <td className="px-5 py-4">
                    <Badge variant="success">Ready</Badge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    Apr {8 - index}, 2026
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      aria-label={`${resource.title} download is unavailable in the prototype`}
                      disabled
                      size="sm"
                      variant="secondary"
                    >
                      Prototype
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    </DataPanelTable>
  );
}

export function DashboardV2AccountPreview() {
  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card id="membership-preview">
        <CardHeader className="border-b border-border-subtle pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Membership</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Plan state stays compact and action-oriented.
              </p>
            </div>
            <Badge variant="neutral">Free</Badge>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Star className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Unlock unlimited resources
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Keep plan decisions separate from route shell loading and
                billing handoff.
              </p>
              <Button
                aria-label="Plan comparison is unavailable in the prototype"
                className="mt-4"
                disabled
                size="sm"
                variant="secondary"
              >
                Prototype only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="settings-preview">
        <CardHeader className="border-b border-border-subtle pb-4">
          <CardTitle>Settings</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Flat sections with dividers instead of nested cards.
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border-subtle">
          {[
            ["Profile", "Name, email, and public identity"],
            ["Appearance", "Theme mode for your device"],
            ["Security", "Account controls and session state"],
          ].map(([label, detail]) => (
            <div key={label} className="flex items-center gap-3 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Settings className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function DashboardV2CreatorWorkspaceRouteIntro({
  data,
}: {
  data?: DashboardV2CreatorReadyData;
} = {}) {
  const isFirstTimeCreator = data?.activationStage === "first-run";
  const storefrontHref = data?.profile.publicProfileHref ?? routes.dashboardV2CreatorProfile;

  return (
    <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="featured">Creator route</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
          Workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {isFirstTimeCreator
            ? "Set up your storefront, publish your first listing, and unlock creator reporting from one workspace."
            : "Resources, earnings, and storefront status in one place."}
        </p>
      </div>
      <div className="flex w-full flex-nowrap gap-2 overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
        {isFirstTimeCreator ? (
          <>
            <Button asChild size="sm">
              <Link className="whitespace-nowrap" href={routes.dashboardV2CreatorNewResource}>
                Create resource
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link className="whitespace-nowrap" href={storefrontHref}>
                Storefront
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="sm">
              <Link className="whitespace-nowrap" href={routes.dashboardV2CreatorResources}>
                Resources
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link className="whitespace-nowrap" href={storefrontHref}>
                Storefront
              </Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function DashboardV2CreatorWorkspaceResourcesPanel({
  resources,
  totalResources,
}: {
  resources?: DashboardV2CreatorReadyData["resources"];
  totalResources?: number;
}) {
  const resourceRows =
    resources?.map((resource: DashboardV2CreatorReadyData["resources"][number]) => ({
      key: resource.id,
      title: resource.title,
      status: resource.status,
      sales: resource.salesLabel,
      downloads: resource.downloadsLabel,
      href: resource.href,
    })) ??
    creatorResources.map((resource) => ({
      key: resource.title,
      title: resource.title,
      status: resource.status,
      sales: resource.sales,
      downloads: resource.downloads,
      href: null,
    }));
  const fillerRowCount =
    resources && resourceRows.length > 0
      ? Math.max(0, 5 - resourceRows.length)
      : 0;
  const resourcesPanel = (
    <DataPanelTable
      title="Recent resources"
      description="Latest updates across status, revenue, and downloads."
      actions={
        <Button asChild size="sm" variant="ghost">
          <Link href={routes.dashboardV2CreatorResources}>
            All resources
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
      }
      bodyClassName="p-0"
      footer={
        resources && resourceRows.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {totalResources && totalResources > resourceRows.length
              ? `Showing latest ${resourceRows.length} of ${totalResources} resources`
              : `Showing ${resourceRows.length} resource${resourceRows.length === 1 ? "" : "s"}`}
          </p>
        ) : undefined
      }
      id="creator-resources"
    >
      <>
        {resources && resourceRows.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              title="No creator resources yet"
              description="Create your first resource to start tracking sales and downloads here."
              action={
                <Button asChild size="sm">
                  <Link href={routes.dashboardV2CreatorNewResource}>
                    Create resource
                  </Link>
                </Button>
              }
              className="min-h-0 w-full max-w-none px-6 py-10"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b border-border-subtle text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Resource
                  </th>
                  <th scope="col" className="w-32 px-5 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="w-32 px-5 py-3 font-medium">
                    Revenue
                  </th>
                  <th scope="col" className="w-36 px-5 py-3 font-medium">
                    Downloads
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {resourceRows.map((resource) => (
                  <tr key={resource.key}>
                    <td className="max-w-0 px-5 py-4">
                      {resource.href ? (
                        <Link
                          href={resource.href}
                          className="block truncate text-sm font-semibold text-foreground transition hover:text-primary"
                        >
                          {resource.title}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-foreground">
                          {resource.title}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        className="w-fit"
                        variant={
                          resource.status === "Published"
                            ? "success"
                            : resource.status === "Draft"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {resource.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                      {resource.sales}
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                      {resource.downloads}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: fillerRowCount }).map((_, index) => (
                  <tr key={`filler-${index}`} aria-hidden="true" className="bg-card">
                    <td className="px-5 py-4">
                      <div className="h-4 w-3/5 rounded-md bg-muted/40" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-20 rounded-full bg-muted/40" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 rounded-md bg-muted/40" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded-md bg-muted/40" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    </DataPanelTable>
  );

  return resourcesPanel;
}

export function DashboardV2CreatorWorkspace({
  data,
  resources,
  resourcePanel,
}: {
  data?: DashboardV2CreatorReadyData;
  resources?: DashboardV2CreatorReadyData["resources"];
  resourcePanel?: ReactNode;
} = {}) {
  const checklistItems = data?.checklist ?? [];
  const completedChecklistCount = checklistItems.filter((item) => item.done).length;
  const isFirstTimeCreator = data?.activationStage === "first-run";
  const workspaceCtaHref = routes.dashboardV2CreatorAnalytics;
  const workspaceCtaLabel = "Full analytics";
  const nextUnlocks = [
    {
      title: "Storefront live",
      detail: "Share your page after your first publish.",
      icon: Store,
    },
    {
      title: "Earnings visible",
      detail: "Sales and payouts appear after your first order.",
      icon: CircleDollarSign,
    },
    {
      title: "Analytics active",
      detail: "Insights unlock as your store gets traffic.",
      icon: BarChart3,
    },
  ] as const;

  return (
    <section id="creator-workspace" className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between xl:col-span-2">
          <div>
            <h2 className="font-ui text-2xl font-semibold text-foreground">
              Overview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFirstTimeCreator
                ? "Finish your setup, create your first listing, and keep the launch steps in one place."
                : "Revenue, resources, and downloads from your creator workspace."}
            </p>
          </div>
          {!isFirstTimeCreator ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={workspaceCtaHref}>
                {workspaceCtaLabel}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>

        <div id="creator-analytics" className="flex flex-col gap-4">
          <DashboardV2CreatorStats stats={data?.stats} />
          {resourcePanel ?? (
            <DashboardV2CreatorWorkspaceResourcesPanel
              resources={resources}
              totalResources={data?.totalResourceCount}
            />
          )}
        </div>

        <Card id="creator-quick-links">
          <CardHeader className="border-b border-border-subtle pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>
                  {isFirstTimeCreator ? "Launch checklist" : "Next steps"}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isFirstTimeCreator
                    ? "Finish setup and ship your first listing."
                    : "Progress and shortcuts for your workspace."}
                </p>
              </div>
              {checklistItems.length > 0 ? (
                <Badge
                  className="shrink-0"
                  variant={
                    completedChecklistCount === checklistItems.length
                      ? "success"
                      : "warning"
                  }
                >
                  {completedChecklistCount}/{checklistItems.length} complete
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="py-0">
            <div className="divide-y divide-border-subtle">
              {checklistItems.map((item: DashboardV2CreatorReadyData["checklist"][number]) => (
              <div key={item.label} className="flex items-center gap-3 py-4">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    item.done
                      ? "bg-[hsl(var(--success-500)/0.12)] text-[hsl(var(--success-600))]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.done ? (
                    <CheckCircle2 className="size-4" aria-hidden />
                  ) : (
                    <Clock3 className="size-4" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <Badge variant={item.done ? "success" : "neutral"}>
                  {item.done ? "Done" : "Next"}
                </Badge>
              </div>
              ))}
            </div>
            <div className="border-y border-border-subtle px-6 py-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                What unlocks next
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                What unlocks after your first publish.
              </p>
            </div>
            <div className="divide-y divide-border-subtle">
              {nextUnlocks.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 py-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <item.icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function DashboardV2CreatorWorkspaceResourcesLoadingPanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div className="space-y-2">
          <LoadingSkeleton className="h-5 w-36" />
          <LoadingSkeleton className="h-4 w-72 max-w-full" />
        </div>
        <LoadingSkeleton className="hidden h-9 w-32 rounded-xl md:block" />
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-[minmax(0,1fr)_128px_128px_144px] gap-4 border-b border-border-subtle px-5 py-3">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-3 w-14" />
          <LoadingSkeleton className="h-3 w-16" />
          <LoadingSkeleton className="h-3 w-20" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid min-w-[680px] grid-cols-[minmax(0,1fr)_128px_128px_144px] gap-4 border-b border-border-subtle px-5 py-4"
          >
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-5 w-16 rounded-full" />
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="border-t border-border-subtle bg-muted/60 px-5 py-3">
        <LoadingSkeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export function DashboardV2ContentOnlySkeletonPreview() {
  return (
    <Card id="dashboard-contract">
      <CardHeader className="border-b border-border-subtle pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="warning">Contract demo only</Badge>
            <CardTitle>Content-only loading contract</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              This is allowed inside the shell. Sidebar and topbar do not repeat.
            </p>
          </div>
          <Badge variant="neutral">Route loading</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 py-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border-subtle bg-background p-4"
            >
              <LoadingSkeleton className="size-9 rounded-xl" />
              <LoadingSkeleton className="mt-4 h-7 w-16" />
              <LoadingSkeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-4 border-b border-border-subtle bg-muted/50 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_120px]">
            <LoadingSkeleton className="h-3 w-24" />
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="hidden h-3 w-16 sm:block" />
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_90px] gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_120px_120px]"
              >
                <div className="min-w-0 space-y-2">
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
                <LoadingSkeleton className="h-5 w-16 rounded-full" />
                <LoadingSkeleton className="hidden h-8 w-20 rounded-lg sm:block" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardV2HomeHeader({ firstName }: { firstName: string }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="neutral">Overview</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review your library, recent activity, and membership status in one place.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={routes.dashboardV2Library}>Open library</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={routes.dashboardV2Downloads}>View downloads</Link>
        </Button>
      </div>
    </section>
  );
}

const HOME_STAT_ICONS: Record<
  DashboardV2HomeStatKey,
  ComponentType<{ className?: string }>
> = {
  library: BookOpen,
  downloads: ArrowDownToLine,
  purchases: ReceiptText,
  membership: ShieldCheck,
};

function DashboardV2HomeSummaryStats({
  stats,
}: {
  stats: DashboardV2HomeStatItem[];
}) {
  const resolvedStats: Stat[] = stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
    detail: stat.detail,
    icon: HOME_STAT_ICONS[stat.key],
    accentClassName: stat.isError
      ? "border-[hsl(var(--warning-500)/0.24)]"
      : undefined,
    iconClassName: stat.isError
      ? "bg-[hsl(var(--warning-500)/0.12)] text-[hsl(var(--warning-600))]"
      : undefined,
  }));

  return <StatGrid stats={resolvedStats} />;
}

function DashboardV2HomeSurfaceStateCard({
  state,
}: {
  state: Exclude<DashboardV2HomeSurfaceState<unknown>, { status: "ready" }>;
}) {
  return (
    <div className="py-4">
      <EmptyState
        title={state.title}
        description={state.description}
        action={
          state.status === "empty" && state.ctaHref && state.ctaLabel ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={state.ctaHref}>{state.ctaLabel}</Link>
            </Button>
          ) : undefined
        }
        className="min-h-[220px] border-border-subtle py-12"
      />
    </div>
  );
}

function DashboardV2HomeContinueLearning({
  state,
}: {
  state: DashboardV2HomeSurfaceState<DashboardV2HomeContinueLearningItem[]>;
}) {
  return (
    <Card id="learning-library">
      <CardHeader className="border-b border-border-subtle pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Continue learning</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Your most recent resources, ready to open again.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={routes.dashboardV2Library}>
              Library
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardHeader>
      {state.status === "ready" ? (
        <CardContent className="grid gap-3 py-4 md:grid-cols-3">
          {state.data.map((resource) => (
            <ResourceIntentLink
              key={resource.id}
              href={resource.href}
              className="rounded-xl border border-border-subtle bg-background p-3 transition hover:bg-muted/40"
            >
              <div className="relative h-28 overflow-hidden rounded-lg border border-border-subtle bg-muted/50">
                {resource.previewUrl ? (
                  <Image
                    src={resource.previewUrl}
                    alt={resource.title}
                    fill
                    sizes="(min-width: 1280px) 250px, (min-width: 768px) 33vw, 100vw"
                    unoptimized={shouldBypassImageOptimizer(resource.previewUrl)}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {resource.title}
                  </h3>
                  <Badge variant={resource.statusVariant}>
                    {resource.statusLabel}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {resource.meta}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="truncate">{resource.secondaryLabel}</span>
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </div>
              </div>
            </ResourceIntentLink>
          ))}
        </CardContent>
      ) : (
        <CardContent>
          <DashboardV2HomeSurfaceStateCard state={state} />
        </CardContent>
      )}
    </Card>
  );
}

function DashboardV2HomeRecentActivity({
  state,
}: {
  state: DashboardV2HomeSurfaceState<DashboardV2HomeActivityItem[]>;
}) {
  return (
    <Card id="recent-activity">
      <CardHeader className="border-b border-border-subtle pb-4">
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      {state.status === "ready" ? (
        <CardContent className="divide-y divide-border-subtle">
          {state.data.map((activity) => {
            const Icon =
              activity.kind === "download" ? ArrowDownToLine : ReceiptText;

            return (
              <div key={activity.id} className="flex gap-3 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {activity.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {activity.detail}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {activity.timeLabel}
                </p>
              </div>
            );
          })}
        </CardContent>
      ) : (
        <CardContent>
          <DashboardV2HomeSurfaceStateCard state={state} />
        </CardContent>
      )}
    </Card>
  );
}

function DashboardV2HomeMembershipSnapshot({
  state,
}: {
  state: DashboardV2HomeSurfaceState<DashboardV2HomeMembershipSnapshot>;
}) {
  return (
    <Card id="membership-snapshot">
      <CardHeader className="border-b border-border-subtle pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Membership</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Current plan, renewal status, and billing handoff.
            </p>
          </div>
          {state.status === "ready" ? (
            <Badge variant={state.data.badgeVariant}>{state.data.badgeLabel}</Badge>
          ) : null}
        </div>
      </CardHeader>
      {state.status === "ready" ? (
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Star className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {state.data.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {state.data.detail}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {state.data.support}
              </p>
              <Button asChild className="mt-4" size="sm" variant="secondary">
                <Link href={state.data.ctaHref}>{state.data.ctaLabel}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <DashboardV2HomeSurfaceStateCard state={state} />
        </CardContent>
      )}
    </Card>
  );
}

export function DashboardV2HomeContent({ data }: { data: DashboardV2HomeData }) {
  return (
    <DashboardPageShell routeReady="dashboard-overview">
      <section id="user-dashboard" className="space-y-6">
        <DashboardV2HomeHeader firstName={data.firstName} />
        <div id="purchase-summary">
          <DashboardV2HomeSummaryStats stats={data.stats} />
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DashboardV2HomeContinueLearning state={data.continueLearning} />
          <div className="space-y-4">
            <DashboardV2HomeMembershipSnapshot state={data.membership} />
            <DashboardV2HomeRecentActivity state={data.recentActivity} />
          </div>
        </div>
      </section>
    </DashboardPageShell>
  );
}

export function DashboardV2HomeLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-overview">
      <section id="user-dashboard" className="space-y-6" data-loading-scope="dashboard-v2-home">
        <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="neutral">Overview</Badge>
            <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review your library, recent activity, and membership status in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={routes.dashboardV2Library}>Open library</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={routes.dashboardV2Downloads}>View downloads</Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-3 w-24" />
                    <LoadingSkeleton className="h-8 w-20" />
                  </div>
                  <LoadingSkeleton className="size-9 rounded-xl" />
                </div>
                <LoadingSkeleton className="mt-5 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader className="border-b border-border-subtle pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Continue learning</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your most recent resources, ready to open again.
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={routes.dashboardV2Library}>
                    Library
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 py-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border-subtle bg-background p-3"
                >
                  <LoadingSkeleton className="h-28 rounded-lg" />
                  <LoadingSkeleton className="mt-3 h-4 w-full" />
                  <LoadingSkeleton className="mt-2 h-3 w-2/3" />
                  <LoadingSkeleton className="mt-3 h-3 w-1/2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b border-border-subtle pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Membership</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Current plan, renewal status, and billing handoff.
                    </p>
                  </div>
                  <LoadingSkeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Star className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <LoadingSkeleton className="h-4 w-32" />
                    <LoadingSkeleton className="mt-2 h-4 w-full max-w-[220px]" />
                    <LoadingSkeleton className="mt-2 h-4 w-5/6" />
                    <LoadingSkeleton className="mt-4 h-9 w-32 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border-subtle pb-4">
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border-subtle">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-3 py-4">
                    <LoadingSkeleton className="size-9 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-3 w-1/2" />
                    </div>
                    <LoadingSkeleton className="h-3 w-12" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </DashboardPageShell>
  );
}

export function DashboardV2DownloadsRouteFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-downloads">
      <DashboardV2DownloadsRouteIntro />
      {children}
    </DashboardPageShell>
  );
}

export function DashboardV2DownloadsRouteIntro() {
  return (
    <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="info">Downloads</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
          Download history
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Re-download owned files through the protected download route. File
          access stays gated behind your purchase record.
        </p>
      </div>
      <Button asChild size="sm" variant="secondary">
        <Link href={routes.dashboardV2Library}>Open library</Link>
      </Button>
    </section>
  );
}

function DashboardV2DownloadsSummaryCards({
  data,
}: {
  data: DashboardV2DownloadsData;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-semibold text-foreground">
            {data.count} download{data.count === 1 ? "" : "s"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>Only files you already opened appear here.</span>
            {data.latestDownloadLabel ? (
              <span>Last download {data.latestDownloadLabel}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-semibold text-muted-foreground">Protected entry</p>
          <p className="mt-2 text-base font-semibold text-foreground">
            Use the secure download route
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Every CTA here goes through `/api/download/:resourceId`, not a direct
            file URL.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export function DashboardV2DownloadsSummaryLoadingContent() {
  return (
    <div className="space-y-4" data-loading-scope="dashboard-v2-downloads">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="py-4">
              <LoadingSkeleton className="h-5 w-28" />
              <div className="mt-3 flex flex-wrap gap-3">
                <LoadingSkeleton className="h-4 w-44" />
                <LoadingSkeleton className="h-4 w-28" />
              </div>
              {index === 1 ? (
                <LoadingSkeleton className="mt-4 h-9 w-32 rounded-xl" />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>
      <DashboardV2DownloadsBodyLoadingContent />
    </div>
  );
}

export function DashboardV2DownloadsBodyLoadingContent() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
      <div className="grid grid-cols-[minmax(0,1.8fr)_110px] gap-4 border-b border-border-subtle bg-muted/40 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_90px_110px]">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-3 w-16 justify-self-end md:hidden" />
        <LoadingSkeleton className="hidden h-3 w-16 md:block" />
        <LoadingSkeleton className="hidden h-3 w-20 md:block" />
        <LoadingSkeleton className="hidden h-3 w-12 md:block" />
        <LoadingSkeleton className="h-3 w-16 justify-self-end" />
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1.8fr)_110px] gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_90px_110px] md:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <LoadingSkeleton className="size-10 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-5/6" />
                <LoadingSkeleton className="h-3 w-1/2" />
              </div>
            </div>
            <LoadingSkeleton className="hidden h-4 w-20 md:block" />
            <LoadingSkeleton className="hidden h-4 w-20 md:block" />
            <LoadingSkeleton className="hidden h-4 w-14 md:block" />
            <LoadingSkeleton className="h-8 w-24 justify-self-end rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardV2DownloadsRouteBody({
  data,
}: {
  data: DashboardV2DownloadsData;
}) {
  const tableDescription =
    data.count > data.visibleCount
      ? `Showing the latest ${data.visibleCount} downloads. Open library to re-download older purchases.`
      : "Recent protected-download activity across your owned resources.";

  return (
    <>
      {data.state === "error" ? (
        <EmptyState
          title={data.errorTitle ?? "Could not load downloads"}
          description={data.errorDescription}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href={routes.dashboardV2Downloads}>Retry</Link>
            </Button>
          }
          className="border-border-subtle py-16"
        />
      ) : data.state === "empty" ? (
        <EmptyState
          icon={<ArrowDownToLine className="size-5 text-muted-foreground" aria-hidden />}
          title="No downloads yet"
          description="Downloaded files will appear here after you open them from your library."
          action={
            <Button asChild size="sm">
              <Link href={routes.dashboardV2Library}>Open library</Link>
            </Button>
          }
          className="border-border-subtle py-16"
        />
      ) : (
        <DataPanelTable
          title="Recent downloads"
          description={tableDescription}
          bodyClassName="p-0"
        >
          <>
            <div className="grid grid-cols-[minmax(0,1.8fr)_110px] gap-4 border-b border-border-subtle bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_90px_110px]">
              <span>Resource</span>
              <span className="hidden md:block">Creator</span>
              <span className="hidden md:block">Downloaded</span>
              <span className="hidden md:block">Size</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.downloads.map((download) => (
                <div
                  key={download.id}
                  className="grid grid-cols-[minmax(0,1.8fr)_110px] gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_90px_110px] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-muted">
                      {download.resource.previewUrl ? (
                        <Image
                          src={download.resource.previewUrl}
                          alt={download.resource.title}
                          fill
                          sizes="40px"
                          unoptimized={shouldBypassImageOptimizer(
                            download.resource.previewUrl,
                          )}
                          className="object-cover"
                        />
                      ) : (
                        <FileText
                          className="size-4 text-muted-foreground/60"
                          aria-hidden
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <ResourceIntentLink
                        href={routes.resource(download.resource.slug)}
                        className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {download.resource.title}
                      </ResourceIntentLink>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="neutral">{download.resource.type}</Badge>
                        <span className="truncate text-xs text-muted-foreground md:hidden">
                          {download.resource.authorName ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="hidden truncate text-sm text-muted-foreground md:block">
                    {download.resource.authorName ?? "—"}
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    {formatDate(download.downloadedAt)}
                  </span>
                  <span className="hidden text-sm text-muted-foreground md:block">
                    {formatDashboardV2DownloadFileSize(download.resource.fileSize)}
                  </span>
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant="secondary">
                      <a href={`/api/download/${download.resource.id}`}>Download</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        </DataPanelTable>
      )}
    </>
  );
}

export function DashboardV2DownloadsLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-downloads">
      <DashboardV2DownloadsRouteIntro />
      <DashboardV2DownloadsSummaryLoadingContent />
    </DashboardPageShell>
  );
}

export function DashboardV2DownloadsContent({
  data,
}: {
  data: DashboardV2DownloadsData;
}) {
  return (
    <DashboardV2DownloadsRouteFrame>
      <div data-route-shell-ready="dashboard-downloads" className="space-y-4">
        <DashboardV2DownloadsSummaryCards data={data} />
        <DashboardV2DownloadsRouteBody data={data} />
      </div>
    </DashboardV2DownloadsRouteFrame>
  );
}

export function DashboardV2CreatorContent({
  data,
}: {
  data?: DashboardV2CreatorOverviewData;
} = {}) {
  if (data?.state === "locked" || data?.state === "error") {
    return (
      <DashboardPageShell routeReady="dashboard-creator-overview">
        <DashboardV2RouteIntro
          eyebrow="Creator route"
          title={data.state === "locked" ? "Creator access" : "Workspace"}
          description={
            data.state === "locked"
              ? "Creator tools are available after access is enabled."
              : "Creator workspace data could not load."
          }
          tone={data.state === "locked" ? "warning" : "featured"}
        />
        <section className="rounded-2xl border border-border-subtle bg-card p-6">
          <div className="max-w-xl">
            <h2 className="font-ui text-xl font-semibold text-foreground">
              {data.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {data.description}
            </p>
            {data.state === "locked" ? (
              <Button asChild className="mt-5">
                <Link href={data.ctaHref}>{data.ctaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </section>
      </DashboardPageShell>
    );
  }

  const readyData = data?.state === "ready" ? data : undefined;

  return (
    <DashboardPageShell routeReady="dashboard-creator-overview">
      <DashboardV2CreatorWorkspaceRouteIntro data={readyData} />
      <DashboardV2CreatorWorkspace
        data={readyData}
        resources={readyData?.resources}
      />
    </DashboardPageShell>
  );
}

function DashboardV2CreatorWorkspaceSummaryLoadingContent() {
  return (
    <section className="space-y-6" data-loading-scope="dashboard-v2-creator">
      <DashboardV2CreatorWorkspaceRouteIntro
        data={{
          state: "ready",
          creatorName: "Creator workspace",
          activationStage: "first-run",
          stats: [],
          links: [],
          checklist: [],
          totalResourceCount: 0,
          resources: [],
          profile: {
            displayName: "Creator workspace",
            slugLabel: "No public slug",
            publicProfileHref: null,
            bio: "No storefront bio yet.",
            statusLabel: "Active",
            avatarUrl: null,
            avatarInitial: "C",
            hasBio: false,
            hasSlug: false,
            hasDisplayName: false,
          },
        }}
      />
      <section id="creator-workspace" className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between xl:col-span-2">
            <div>
              <h2 className="font-ui text-2xl font-semibold text-foreground">
                Overview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish your setup, create your first listing, and keep the launch steps in one place.
              </p>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href={routes.dashboardV2CreatorNewResource}>
                Create resource
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <div id="creator-analytics" className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-3">
                        <LoadingSkeleton className="h-3 w-24" />
                        <LoadingSkeleton className="h-8 w-16" />
                      </div>
                      <LoadingSkeleton className="size-9 rounded-xl" />
                    </div>
                    <LoadingSkeleton className="mt-5 h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <DashboardV2CreatorWorkspaceResourcesLoadingPanel />
          </div>

          <Card id="creator-quick-links">
            <CardHeader className="border-b border-border-subtle pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Launch checklist</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Finish setup and ship your first listing.
                  </p>
                </div>
                <LoadingSkeleton className="h-6 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <div className="divide-y divide-border-subtle">
                {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 py-4">
                  <LoadingSkeleton className="size-9 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <LoadingSkeleton className="h-4 w-28" />
                    <LoadingSkeleton className="mt-2 h-3 w-32" />
                  </div>
                  <LoadingSkeleton className="h-6 w-16 rounded-full" />
                </div>
                ))}
              </div>
              <div className="border-y border-border-subtle px-6 py-4">
                <LoadingSkeleton className="h-3 w-16" />
                <LoadingSkeleton className="mt-2 h-4 w-40 max-w-full" />
              </div>
              <div className="divide-y divide-border-subtle">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 py-4">
                    <LoadingSkeleton className="size-9 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <LoadingSkeleton className="h-4 w-28" />
                      <LoadingSkeleton className="mt-2 h-3 w-36" />
                    </div>
                    <LoadingSkeleton className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card id="creator-settings-summary">
            <CardHeader className="border-b border-border-subtle pb-4">
              <div className="space-y-2">
                <LoadingSkeleton className="h-6 w-24" />
                <LoadingSkeleton className="h-4 w-64 max-w-full" />
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <div className="divide-y divide-border-subtle">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <LoadingSkeleton className="h-4 w-36" />
                          <LoadingSkeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <LoadingSkeleton className="h-4 w-full max-w-xl" />
                      </div>
                      <LoadingSkeleton className="h-9 w-full rounded-xl sm:w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </section>
  );
}

export function DashboardV2CreatorWorkspaceLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-creator-overview">
      <DashboardV2CreatorWorkspaceSummaryLoadingContent />
    </DashboardPageShell>
  );
}

const DASHBOARD_V2_LIBRARY_FILTERS: Array<{
  key: DashboardV2LibraryFilterKey;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "pdf", label: "PDF" },
  { key: "worksheets", label: "Worksheets" },
  { key: "templates", label: "Templates" },
];

function DashboardV2LibraryRecovery({
  data,
}: {
  data: DashboardV2LibraryData;
}) {
  if (data.recovery.status === "hidden") {
    return null;
  }

  if (data.recovery.status === "pending") {
    return (
      <Card className="border-[hsl(var(--warning-500)/0.28)] bg-[hsl(var(--warning-500)/0.08)]">
        <CardContent className="flex items-start gap-3 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--warning-500)/0.16)] text-[hsl(var(--warning-600))]">
            <Clock3 className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Confirming your purchase
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Your payment was received. Refresh in a few seconds if the resource
              has not appeared yet.
            </p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={getDashboardV2LibraryHref({ payment: "success" })}>
              Refresh
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[hsl(var(--success-500)/0.28)] bg-[hsl(var(--success-500)/0.08)]">
      <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="success">Purchase confirmed</Badge>
            <p className="text-xs text-muted-foreground">Ready to open now</p>
          </div>
          <p className="mt-3 truncate text-base font-semibold text-foreground">
            {data.recovery.item.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.recovery.item.authorName
              ? `by ${data.recovery.item.authorName}`
              : "Saved to your library"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={`/api/download/${data.recovery.item.id}`}>Download now</a>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <ResourceIntentLink href={routes.resource(data.recovery.item.slug)}>
              View resource
            </ResourceIntentLink>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardV2LibraryToolbar({ data }: { data: DashboardV2LibraryData }) {
  const payment = data.recovery.status !== "hidden" ? "success" : undefined;
  const hasActiveControls = Boolean(data.query) || data.filter !== "all";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form action={routes.dashboardV2Library} className="min-w-0 flex-1">
            {payment ? <input type="hidden" name="payment" value={payment} /> : null}
            {data.filter !== "all" ? (
              <input type="hidden" name="filter" value={data.filter} />
            ) : null}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Library tools</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search by title or creator, then narrow by format.
                </p>
              </div>
              <SearchInput
                name="q"
                defaultValue={data.query}
                placeholder="Search your library"
                containerClassName="min-w-0"
                submitButton={
                  <Button size="sm" type="submit">
                    Search
                  </Button>
                }
              />
            </div>
          </form>
          <div className="space-y-3 xl:max-w-md xl:text-right">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{data.visibleCount}</span>{" "}
              {data.visibleCount === 1 ? "result" : "results"}
              {data.totalOwned > 0 ? (
                <>
                  <span aria-hidden> · </span>
                  <span>{data.totalOwned} owned</span>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {DASHBOARD_V2_LIBRARY_FILTERS.map((entry) => {
                const href = getDashboardV2LibraryHref({
                  q: data.query || undefined,
                  filter: entry.key,
                  payment,
                });
                const isActive = data.filter === entry.key;

                return (
                  <Link
                    key={entry.key}
                    href={href}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border border-primary/30 bg-primary/10 text-primary"
                        : "border border-border-subtle bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {entry.label}
                  </Link>
                );
              })}
              {hasActiveControls ? (
                <Link
                  href={getDashboardV2LibraryHref({ payment })}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardV2LibraryResults({ data }: { data: DashboardV2LibraryData }) {
  const payment = data.recovery.status !== "hidden" ? "success" : undefined;

  if (data.state === "error") {
    return (
      <EmptyState
        title={data.errorTitle ?? "Could not load your library"}
        description={data.errorDescription}
        action={
          <Button asChild size="sm" variant="secondary">
            <Link
              href={getDashboardV2LibraryHref({
                q: data.query,
                filter: data.filter,
                payment,
              })}
            >
              Retry
            </Link>
          </Button>
        }
        className="border-border-subtle py-16"
      />
    );
  }

  if (data.state === "empty") {
    return (
      <EmptyState
        icon={<BookOpen className="size-5 text-muted-foreground" aria-hidden />}
        title="Your library is empty"
        description="Everything you purchase lands here. Start with a resource from the marketplace."
        action={
          <Button asChild size="sm">
            <IntentPrefetchLink
              href={routes.marketplace}
              prefetchLimit={6}
              prefetchScope="dashboard-v2-library-empty"
              resourcesNavigationMode="discover"
            >
              Browse resources
            </IntentPrefetchLink>
          </Button>
        }
        className="border-border-subtle py-16"
      />
    );
  }

  if (data.state === "filtered-empty") {
    return (
      <EmptyState
        icon={<FileText className="size-5 text-muted-foreground" aria-hidden />}
        title="No matching resources"
        description="Try another keyword or clear the current filter."
        action={
          <Button asChild size="sm" variant="secondary">
            <Link href={getDashboardV2LibraryHref({ payment })}>Clear filters</Link>
          </Button>
        }
        className="border-border-subtle py-16"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.items.map((item) => (
        <ResourceCard
          key={item.purchaseId}
          variant="library"
          resource={{
            id: item.id,
            slug: item.slug,
            title: item.title,
            authorName: item.authorName,
            previewUrl: item.previewUrl,
            downloadedAt: item.purchasedAt,
            mimeType: item.mimeType,
            description: "",
            tags: [],
            isFree: true,
            price: 0,
          }}
        />
      ))}
    </div>
  );
}

function DashboardV2LibraryRouteIntro() {
  return (
    <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="info">Library</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
          My library
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Search what you own, recover recent purchases, and reopen the right
          resource quickly.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href={routes.marketplace}>Browse marketplace</Link>
      </Button>
    </section>
  );
}

function DashboardV2LibrarySummaryCards({
  data,
}: {
  data: DashboardV2LibraryData;
}) {
  const continueHref = data.continueItem
    ? routes.resource(data.continueItem.slug)
    : routes.marketplace;
  const summaryLabel =
    data.state === "error"
      ? "Library summary unavailable"
      : `${data.totalOwned} owned resource${data.totalOwned === 1 ? "" : "s"}`;
  const summaryDetail =
    data.state === "error"
      ? data.errorDescription ?? "Open your purchases or refresh the route to try again."
      : data.lastAddedLabel
        ? `Last added ${data.lastAddedLabel}`
        : "Your owned resources will appear here as soon as a purchase completes.";

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-semibold text-foreground">{summaryLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>{summaryDetail}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-semibold text-muted-foreground">Continue</p>
          <p className="mt-2 truncate text-base font-semibold text-foreground">
            {data.continueItem?.title ?? "Browse your next resource"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.continueItem?.authorName ??
              "Open what you already own or find something new."}
          </p>
          <Button asChild className="mt-4" size="sm" variant="secondary">
            <Link href={continueHref}>
              {data.continueItem ? "Open resource" : "Browse resources"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function DashboardV2LibrarySummaryLoadingContent() {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Card>
        <CardContent className="py-4">
          <LoadingSkeleton className="h-5 w-36" />
          <div className="mt-3 flex flex-wrap gap-3">
            <LoadingSkeleton className="h-4 w-28" />
            <LoadingSkeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="mt-3 h-5 w-40" />
          <LoadingSkeleton className="mt-2 h-4 w-32" />
          <LoadingSkeleton className="mt-4 h-9 w-32 rounded-xl" />
        </CardContent>
      </Card>
    </section>
  );
}

function DashboardV2LibraryBodyLoadingContent() {
  return (
    <div className="space-y-6" data-loading-scope="dashboard-v2-library">
      <div className="rounded-xl border border-border-subtle bg-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <LoadingSkeleton className="h-5 w-28" />
              <LoadingSkeleton className="h-4 w-56 max-w-full" />
            </div>
            <div className="flex gap-3">
              <LoadingSkeleton className="h-10 flex-1 rounded-xl" />
              <LoadingSkeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3 xl:w-72">
            <LoadingSkeleton className="h-4 w-24 xl:ml-auto" />
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {Array.from({ length: 4 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border-subtle bg-card"
          >
            <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-3 p-4">
              <LoadingSkeleton className="h-5 w-5/6" />
              <LoadingSkeleton className="h-4 w-1/2" />
              <LoadingSkeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardV2LibraryLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-library">
      <DashboardV2LibraryRouteIntro />
      <DashboardV2LibrarySummaryLoadingContent />
      <DashboardV2LibraryBodyLoadingContent />
    </DashboardPageShell>
  );
}

export function DashboardV2LibraryContent({
  data,
}: {
  data: DashboardV2LibraryData;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-library">
      <DashboardV2LibraryRouteIntro />
      <div data-route-shell-ready="dashboard-library" className="space-y-6">
        <DashboardV2LibrarySummaryCards data={data} />
        <div className="space-y-6">
          <DashboardV2LibraryRecovery data={data} />
          <DashboardV2LibraryToolbar data={data} />
          <DashboardV2LibraryResults data={data} />
        </div>
      </div>
    </DashboardPageShell>
  );
}

const DASHBOARD_V2_PURCHASE_STATUS_BADGES: Record<
  string,
  { label: string; variant: "success" | "warning" | "neutral" }
> = {
  COMPLETED: { label: "Completed", variant: "success" },
  PENDING: { label: "Pending", variant: "warning" },
  FAILED: { label: "Failed", variant: "neutral" },
  REFUNDED: { label: "Refunded", variant: "neutral" },
};

export function DashboardV2PurchasesRouteFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-purchases">
      <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="info">Purchases</Badge>
          <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
            Order history
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review completed, pending, and failed purchases in one ledger.
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href={routes.marketplace}>Browse marketplace</Link>
        </Button>
      </section>
      {children}
    </DashboardPageShell>
  );
}

export function DashboardV2PurchasesSectionsSkeleton() {
  return (
    <div className="space-y-4" data-loading-scope="dashboard-v2-purchases">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="py-4">
              <LoadingSkeleton className="h-5 w-24" />
              <div className="mt-3 flex flex-wrap gap-3">
                <LoadingSkeleton className="h-4 w-24" />
                <LoadingSkeleton className="h-4 w-28" />
              </div>
              {index === 1 ? (
                <>
                  <LoadingSkeleton className="mt-3 h-5 w-48" />
                  <LoadingSkeleton className="mt-2 h-4 w-full max-w-[220px]" />
                </>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
        <div className="grid grid-cols-[minmax(0,1.9fr)_110px] gap-4 border-b border-border-subtle bg-muted/40 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_120px]">
          <LoadingSkeleton className="h-3 w-16" />
          <LoadingSkeleton className="h-3 w-16 justify-self-end md:hidden" />
          <LoadingSkeleton className="hidden h-3 w-16 md:block" />
          <LoadingSkeleton className="hidden h-3 w-14 md:block" />
          <LoadingSkeleton className="hidden h-3 w-16 md:block" />
          <LoadingSkeleton className="h-3 w-16 justify-self-end" />
        </div>
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,1.9fr)_110px] gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_120px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <LoadingSkeleton className="size-10 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <LoadingSkeleton className="h-4 w-5/6" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
              </div>
              <LoadingSkeleton className="hidden h-4 w-20 md:block" />
              <LoadingSkeleton className="hidden h-4 w-20 md:block" />
              <LoadingSkeleton className="hidden h-4 w-16 md:block" />
              <LoadingSkeleton className="h-6 w-20 justify-self-end rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardV2PurchasesRouteBody({
  data,
}: {
  data: DashboardV2PurchasesData;
}) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-foreground">
              {data.orderCount} order{data.orderCount === 1 ? "" : "s"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{data.completedCount} completed</span>
              <span>Total spent {data.totalSpentLabel}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-muted-foreground">Status matrix</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              Completed, pending, failed, refunded
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This route keeps the commerce ledger separate from download history.
            </p>
          </CardContent>
        </Card>
      </section>

      {data.state === "error" ? (
        <EmptyState
          title={data.errorTitle ?? "Could not load purchases"}
          description={data.errorDescription}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href={routes.dashboardV2Purchases}>Retry</Link>
            </Button>
          }
          className="border-border-subtle py-16"
        />
      ) : data.state === "empty" ? (
        <EmptyState
          icon={<ReceiptText className="size-5 text-muted-foreground" aria-hidden />}
          title="No purchases yet"
          description="Your completed and in-flight orders will appear here once you buy a resource."
          action={
          <Button asChild size="sm">
            <IntentPrefetchLink
              href={routes.marketplace}
              prefetchLimit={6}
              prefetchScope="dashboard-v2-purchases-empty"
              resourcesNavigationMode="discover"
            >
              Browse resources
            </IntentPrefetchLink>
          </Button>
        }
        className="border-border-subtle py-16"
        />
      ) : (
        <DataPanelTable title="Purchase ledger" bodyClassName="p-0">
          <>
            <div className="grid grid-cols-[minmax(0,1.9fr)_110px] gap-4 border-b border-border-subtle bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_120px]">
              <span>Resource</span>
              <span className="hidden md:block">Creator</span>
              <span className="hidden md:block">Date</span>
              <span className="hidden md:block">Amount</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {data.purchases.map((purchase) => {
                const status =
                  DASHBOARD_V2_PURCHASE_STATUS_BADGES[purchase.status] ??
                  DASHBOARD_V2_PURCHASE_STATUS_BADGES.PENDING;

                return (
                  <div
                    key={purchase.id}
                    className="grid grid-cols-[minmax(0,1.9fr)_110px] gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_120px] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-muted">
                        {purchase.resource.previewUrl ? (
                          <Image
                            src={purchase.resource.previewUrl}
                            alt={purchase.resource.title}
                            fill
                            sizes="40px"
                            unoptimized={shouldBypassImageOptimizer(
                              purchase.resource.previewUrl,
                            )}
                            className="object-cover"
                          />
                        ) : (
                          <FileText
                            className="size-4 text-muted-foreground/60"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <ResourceIntentLink
                          href={routes.resource(purchase.resource.slug)}
                          className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {purchase.resource.title}
                        </ResourceIntentLink>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {getDashboardV2PurchaseReference(purchase.id)}
                        </p>
                      </div>
                    </div>
                    <span className="hidden truncate text-sm text-muted-foreground md:block">
                      {purchase.resource.authorName ?? "—"}
                    </span>
                    <span className="hidden text-sm text-muted-foreground md:block">
                      {formatDate(purchase.createdAt)}
                    </span>
                    <span className="hidden text-sm text-muted-foreground md:block">
                      {purchase.resource.isFree
                        ? "Free"
                        : formatPrice(purchase.amount / 100)}
                    </span>
                    <div className="flex justify-end">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        </DataPanelTable>
      )}
    </>
  );
}

export function DashboardV2PurchasesContent({
  data,
}: {
  data: DashboardV2PurchasesData;
}) {
  return (
    <DashboardV2PurchasesRouteFrame>
      <DashboardV2PurchasesRouteBody data={data} />
    </DashboardV2PurchasesRouteFrame>
  );
}

export function DashboardV2MembershipContent({
  data,
  subscriptionState,
}: {
  data: DashboardV2MembershipData;
  subscriptionState?: string | null;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-subscription">
      <DashboardV2MembershipIntroContent
        actions={
          <DashboardV2MembershipActions
            primaryHref={data.primaryCtaHref}
            primaryLabel={data.primaryCtaLabel}
            secondaryHref={data.secondaryCtaHref}
            secondaryLabel={data.secondaryCtaLabel}
            canCancelSubscription={data.canCancelSubscription}
            cancellationScheduled={data.cancellationScheduled}
            subscriptionState={subscriptionState}
          />
        }
      />
      <DashboardV2MembershipResolvedContent data={data} />
    </DashboardPageShell>
  );
}

function DashboardV2MembershipIntroContent({
  actions,
}: {
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge variant="info">Membership</Badge>
        <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
          Membership
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review plan status, renewal timing, and billing coverage without
          leaving the dashboard shell.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  );
}

async function DashboardV2MembershipIntroActions({
  dataPromise,
  subscriptionState,
}: {
  dataPromise: Promise<DashboardV2MembershipData>;
  subscriptionState?: string | null;
}) {
  const data = await dataPromise;

  return (
    <DashboardV2MembershipActions
      primaryHref={data.primaryCtaHref}
      primaryLabel={data.primaryCtaLabel}
      secondaryHref={data.secondaryCtaHref}
      secondaryLabel={data.secondaryCtaLabel}
      canCancelSubscription={data.canCancelSubscription}
      cancellationScheduled={data.cancellationScheduled}
      subscriptionState={subscriptionState}
    />
  );
}

function DashboardV2MembershipResolvedContent({
  data,
}: {
  data: DashboardV2MembershipData;
}) {
  return data.state === "error" ? (
    <EmptyState
      title={data.errorTitle ?? "Could not load membership"}
      description={data.errorDescription}
      action={
        <Button asChild size="sm" variant="secondary">
          <Link href={routes.dashboardV2Membership}>Retry</Link>
        </Button>
      }
      className="border-border-subtle py-16"
    />
  ) : (
    <>
      <section className="grid gap-4 xl:grid-cols-3">
        {data.summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {card.value}
                  </p>
                </div>
                {card.badgeLabel ? (
                  <Badge variant={card.badgeVariant ?? "neutral"}>
                    {card.badgeLabel}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {card.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="py-5">
          <div className="min-w-0 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant={data.badgeVariant}>{data.badgeLabel}</Badge>
              <span className="text-xs text-muted-foreground">
                Route-owned membership state
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              {data.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {data.detail}
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {data.support}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

async function DashboardV2MembershipStreamedBody({
  dataPromise,
}: {
  dataPromise: Promise<DashboardV2MembershipData>;
}) {
  const data = await dataPromise;
  return <DashboardV2MembershipResolvedContent data={data} />;
}

function DashboardV2MembershipSectionsLoadingContent() {
  return (
    <div className="space-y-4" data-loading-scope="dashboard-v2-membership">
      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <LoadingSkeleton className="h-3 w-20" />
                  <LoadingSkeleton className="h-5 w-28" />
                </div>
                {index === 0 ? (
                  <LoadingSkeleton className="h-6 w-16 rounded-full" />
                ) : null}
              </div>
              <LoadingSkeleton className="mt-4 h-4 w-full max-w-[220px]" />
              <LoadingSkeleton className="mt-2 h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="rounded-xl border border-border-subtle bg-card p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LoadingSkeleton className="h-6 w-20 rounded-full" />
            <LoadingSkeleton className="h-3 w-36" />
          </div>
          <LoadingSkeleton className="mt-4 h-8 w-full max-w-md" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
          <LoadingSkeleton className="mt-2 h-4 w-5/6" />
          <LoadingSkeleton className="mt-4 h-4 w-full max-w-lg" />
        </div>
      </div>
    </div>
  );
}

export function DashboardV2MembershipStreamedContent({
  dataPromise,
  subscriptionState,
}: {
  dataPromise: Promise<DashboardV2MembershipData>;
  subscriptionState?: string | null;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-subscription">
      <DashboardV2MembershipIntroContent
        actions={
          <Suspense
            fallback={
              <div className="flex flex-wrap gap-2">
                <LoadingSkeleton className="h-9 w-32 rounded-xl" />
                <LoadingSkeleton className="h-9 w-32 rounded-xl" />
              </div>
            }
          >
            <DashboardV2MembershipIntroActions
              dataPromise={dataPromise}
              subscriptionState={subscriptionState}
            />
          </Suspense>
        }
      />
      <Suspense fallback={<DashboardV2MembershipSectionsLoadingContent />}>
        <DashboardV2MembershipStreamedBody dataPromise={dataPromise} />
      </Suspense>
    </DashboardPageShell>
  );
}

export function DashboardV2MembershipLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-subscription">
      <DashboardV2MembershipIntroContent
        actions={
          <div className="flex flex-wrap gap-2">
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        }
      />
      <DashboardV2MembershipSectionsLoadingContent />
    </DashboardPageShell>
  );
}

export function DashboardV2SettingsContent({
  data,
}: {
  data: DashboardV2SettingsData;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-settings">
      <DashboardV2SettingsIntroContent />
      <DashboardV2SettingsResolvedContent data={data} />
    </DashboardPageShell>
  );
}

async function DashboardV2SettingsStreamedSections({
  dataPromise,
}: {
  dataPromise: Promise<DashboardV2SettingsData>;
}) {
  const data = await dataPromise;
  return <DashboardV2SettingsResolvedContent data={data} />;
}

function DashboardV2SettingsIntroContent() {
  return (
    <section className="border-b border-border-subtle pb-6">
      <Badge variant="info">Settings</Badge>
      <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
        Account settings
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Update your profile, appearance, notifications, and account controls from one protected dashboard page.
      </p>
    </section>
  );
}

function DashboardV2SettingsResolvedContent({
  data,
}: {
  data: DashboardV2SettingsData;
}) {
  return (
    <>
      {data.state === "error" ? (
        <EmptyState
          title={data.errorTitle ?? "Could not load settings"}
          description={data.errorDescription}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href={routes.dashboardV2Settings}>Retry</Link>
            </Button>
          }
          className="border-border-subtle py-16"
        />
      ) : (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="min-w-0">
            <div className="rounded-2xl border border-border-subtle bg-card px-6 py-6">
              <div id="settings-profile" className="scroll-mt-24">
                <ProfileSettings
                  name={data.profile.displayName}
                  email={data.profile.email}
                  image={data.profile.avatarUrl}
                  providerImage={data.profile.providerAvatarUrl}
                  providerLabel={data.profile.providerLabel}
                />
              </div>
              <div
                id="settings-preferences"
                className="mt-8 scroll-mt-24 border-t border-border-subtle pt-8"
              >
                <PreferenceSettings theme={data.preferences.theme} />
              </div>
              <div
                id="settings-notifications"
                className="mt-8 scroll-mt-24 border-t border-border-subtle pt-8"
              >
                <NotificationSettings
                  emailNotifications={data.notifications.emailNotifications}
                  purchaseReceipts={data.notifications.purchaseReceipts}
                  productUpdates={data.notifications.productUpdates}
                  marketingEmails={data.notifications.marketingEmails}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 xl:sticky xl:top-24">
            <section className="space-y-3 rounded-2xl border border-border-subtle bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account notes
              </p>
              <div className="space-y-3 text-small text-muted-foreground">
                <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current plan
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {data.accountAccess.currentPlanLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Member since
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {data.accountAccess.memberSinceLabel}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-border-subtle bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Billing
              </p>
              <div className="space-y-3">
                <Link
                  href={routes.dashboardV2Membership}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-background px-4 py-3 transition-colors hover:border-border hover:bg-card"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CircleDollarSign className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Membership billing</p>
                    <p className="mt-1 text-small text-muted-foreground">
                      Manage your plan and billing.
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
                <Link
                  href={routes.dashboardV2Purchases}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-background px-4 py-3 transition-colors hover:border-border hover:bg-card"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ReceiptText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Receipts and order history
                    </p>
                    <p className="mt-1 text-small text-muted-foreground">
                      Review past purchases.
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            </section>

            <div
              id="settings-account-access"
              className="scroll-mt-24 rounded-2xl border border-border-subtle bg-card p-5"
            >
              <SecuritySettings
                email={data.accountAccess.email}
                signInMethodLabel={data.accountAccess.signInMethodLabel}
                canResetPassword={data.accountAccess.canResetPassword}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardV2SettingsStreamedContent({
  dataPromise,
}: {
  dataPromise: Promise<DashboardV2SettingsData>;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-settings">
      <DashboardV2SettingsIntroContent />
      <Suspense fallback={<DashboardV2SettingsSectionsLoadingContent />}>
        <DashboardV2SettingsStreamedSections dataPromise={dataPromise} />
      </Suspense>
    </DashboardPageShell>
  );
}

function DashboardV2SettingsSectionsLoadingContent() {
  return (
    <div
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
      data-loading-scope="dashboard-v2-settings"
    >
      <div className="min-w-0">
        <section className="rounded-2xl border border-border-subtle bg-card px-6 py-6">
          <div className="space-y-5 border-b border-border-subtle pb-8">
            <LoadingSkeleton className="h-6 w-24" />
            <LoadingSkeleton className="h-4 w-56" />
            <div className="flex flex-col gap-5 border-b border-border-subtle pb-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <LoadingSkeleton className="size-[72px] rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LoadingSkeleton className="h-5 w-24" />
                    <LoadingSkeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="mt-2 space-y-2">
                    <LoadingSkeleton className="h-4 w-56" />
                    <LoadingSkeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <LoadingSkeleton className="h-9 w-32 rounded-xl" />
                <LoadingSkeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <LoadingSkeleton className="h-3 w-20" />
                  <LoadingSkeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <LoadingSkeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>

          <div className="space-y-5 border-b border-border-subtle py-8">
            <LoadingSkeleton className="h-6 w-28" />
            <LoadingSkeleton className="h-4 w-72" />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px] md:items-start md:gap-6">
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-4 w-full max-w-sm" />
              </div>
              <LoadingSkeleton className="h-11 w-full rounded-xl md:justify-self-end" />
            </div>
            <div className="flex justify-end">
              <LoadingSkeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>

          <div className="space-y-5 pt-8">
            <LoadingSkeleton className="h-6 w-32" />
            <LoadingSkeleton className="h-4 w-80" />
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4 py-3">
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-4 w-36" />
                    <LoadingSkeleton className="h-4 w-full max-w-sm" />
                  </div>
                  <LoadingSkeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="space-y-3 rounded-2xl border border-border-subtle bg-card p-5">
          <LoadingSkeleton className="h-3 w-20" />
          <div className="space-y-3">
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="mt-3 h-4 w-40" />
            </div>
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="mt-3 h-4 w-28" />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border-subtle bg-card p-5">
          <LoadingSkeleton className="h-3 w-16" />
          <div className="space-y-3">
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <LoadingSkeleton className="size-11 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <LoadingSkeleton className="h-4 w-36" />
                  <LoadingSkeleton className="h-4 w-44" />
                </div>
                <LoadingSkeleton className="size-4 rounded-full" />
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <LoadingSkeleton className="size-11 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <LoadingSkeleton className="h-4 w-40" />
                  <LoadingSkeleton className="h-4 w-40" />
                </div>
                <LoadingSkeleton className="size-4 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border-subtle bg-card p-5">
          <LoadingSkeleton className="h-3 w-14" />
          <div className="space-y-3">
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <LoadingSkeleton className="h-4 w-28" />
              <LoadingSkeleton className="mt-3 h-4 w-48" />
            </div>
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <LoadingSkeleton className="h-4 w-28" />
              <LoadingSkeleton className="mt-3 h-4 w-40" />
            </div>
            <div className="rounded-xl border border-border-subtle bg-background px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="h-4 w-52" />
                </div>
                <LoadingSkeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="pt-1">
            <LoadingSkeleton className="h-9 w-28 rounded-xl" />
          </div>
        </section>
      </div>
    </div>
  );
}

export function DashboardV2SettingsLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-settings">
      <DashboardV2SettingsIntroContent />
      <DashboardV2SettingsSectionsLoadingContent />
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorResourcesContent({
  data,
}: {
  data: DashboardV2CreatorResourcesData;
}) {
  const inventoryDescription =
    data.filteredCount === 0
      ? data.totalCount === 0
        ? "No resources in inventory yet."
        : "No resources match the current filters."
      : data.filteredCount === data.totalCount
        ? `Showing ${data.pageStart}–${data.pageEnd} of ${data.totalCount} total.`
        : `Showing ${data.pageStart}–${data.pageEnd} of ${data.filteredCount} matching.`;

  const totalCardDetail =
    data.filteredCount === data.totalCount
      ? `${data.totalCount} in inventory`
      : `${data.filteredCount} matching`;

  const paginationItems = buildPaginationItems(data.page, data.totalPages);

  return (
    <DashboardPageShell routeReady="dashboard-creator-resources">
      <DashboardV2RouteIntro
        action={
          data.state === "locked" ? null : (
            <Button asChild>
              <Link href={routes.dashboardV2CreatorNewResource}>
                <Plus className="size-4" aria-hidden />
                New resource
              </Link>
            </Button>
          )
        }
        eyebrow="Creator resources"
        title="Creator resources"
        description="Manage draft, published, and archived resources from one route-owned inventory."
        tone="featured"
      />

      {data.state === "locked" || data.state === "error" ? (
        <EmptyState
          icon={<FileText className="size-5 text-muted-foreground" aria-hidden />}
          title={data.errorTitle ?? "Could not load creator resources"}
          description={data.errorDescription}
          action={
            data.state === "locked" ? (
              <Button asChild size="sm">
                <Link href={routes.dashboardV2CreatorApply}>Apply for creator access</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="secondary">
                <Link href={getDashboardV2CreatorResourcesHref()}>Retry</Link>
              </Button>
            )
          }
          className="border-border-subtle py-16"
        />
      ) : (
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Card size="sm">
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Total
                </p>
                <p className="mt-2 font-ui text-2xl font-semibold text-foreground">
                  {data.totalCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalCardDetail}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Published
                </p>
                <p className="mt-2 font-ui text-2xl font-semibold text-foreground">
                  {data.publishedCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Live in the catalog
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Drafts
                </p>
                <p className="mt-2 font-ui text-2xl font-semibold text-foreground">
                  {data.draftCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.archivedCount} archived
                </p>
              </CardContent>
            </Card>
          </div>

          <DataPanelTable
            title="Resource inventory"
            description={inventoryDescription}
            actions={
              data.status !== "all" || data.pricing !== "all" || data.categoryId ? (
                <Link
                  href={getDashboardV2CreatorResourcesHref({ sort: data.sort })}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear filters
                </Link>
              ) : null
            }
            toolbar={
              <DashboardV2CreatorInventoryFilters
                categoryId={data.categoryId}
                pricing={data.pricing}
                pricingOptions={DASHBOARD_V2_CREATOR_RESOURCE_PRICING_FILTERS}
                sort={data.sort}
                sortOptions={DASHBOARD_V2_CREATOR_RESOURCE_SORTS}
                status={data.status}
                statusOptions={DASHBOARD_V2_CREATOR_RESOURCE_STATUS_FILTERS}
              />
            }
          >
            {data.state === "empty" ? (
              <div className="p-5">
                <EmptyState
                  icon={
                    <PackagePlus
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  }
                  title="No creator resources yet"
                  description="Create your first resource to start building your catalog."
                  action={
                    <Button asChild size="sm">
                      <Link href={routes.dashboardV2CreatorNewResource}>
                        New resource
                      </Link>
                    </Button>
                  }
                  className="border-border-subtle py-16"
                />
              </div>
            ) : data.state === "filtered-empty" ? (
              <div className="p-5">
                <EmptyState
                  icon={
                    <FileText
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  }
                  title="No matching resources"
                  description="Try another status, pricing, or sort option."
                  action={
                    <Button asChild size="sm" variant="secondary">
                      <Link href={getDashboardV2CreatorResourcesHref()}>
                        Clear filters
                      </Link>
                    </Button>
                  }
                  className="border-border-subtle py-16"
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Resource
                        </th>
                        <th scope="col" className="w-32 px-5 py-3 font-medium">
                          Status
                        </th>
                        <th scope="col" className="w-36 px-5 py-3 font-medium">
                          Pricing
                        </th>
                        <th scope="col" className="w-32 px-5 py-3 font-medium">
                          Revenue
                        </th>
                        <th scope="col" className="w-32 px-5 py-3 font-medium">
                          Downloads
                        </th>
                        <th scope="col" className="w-32 px-5 py-3 font-medium">
                          Updated
                        </th>
                        <th scope="col" className="w-28 px-5 py-3 font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {data.resources.map((resource) => (
                        <tr key={resource.id}>
                          <td className="max-w-0 px-5 py-4">
                            <Link
                              href={resource.href}
                              className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                              {resource.title}
                            </Link>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {resource.categoryLabel}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              className="w-fit"
                              variant={
                                resource.status === "Published"
                                  ? "success"
                                  : resource.status === "Archived"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {resource.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {resource.pricingLabel}
                          </td>
                          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                            {resource.revenueLabel}
                          </td>
                          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                            {resource.downloadsLabel}
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {resource.updatedLabel}
                          </td>
                          <td className="px-5 py-4">
                            <Button asChild size="sm" variant="secondary">
                              <Link href={resource.href}>Edit</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.totalPages > 1 ? (
                  <div className="flex flex-col gap-3 border-t border-border-subtle bg-muted/20 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <PaginationInfo>
                      Showing {data.pageStart}–{data.pageEnd} of {data.filteredCount} resources
                    </PaginationInfo>
                    <PaginationNav className="justify-start lg:justify-end">
                      <PaginationList className="flex-wrap justify-start lg:justify-end">
                        <Button
                          asChild
                          size="xs"
                          variant="secondary"
                          className="rounded-lg"
                        >
                          <Link
                            aria-disabled={data.page <= 1}
                            tabIndex={data.page <= 1 ? -1 : undefined}
                            href={getDashboardV2CreatorResourcesHref({
                              status: data.status,
                              pricing: data.pricing,
                              sort: data.sort,
                              categoryId: data.categoryId,
                              page: Math.max(1, data.page - 1),
                            })}
                            className={cn(data.page <= 1 && "pointer-events-none opacity-40")}
                          >
                            Previous
                          </Link>
                        </Button>
                        {paginationItems.map((item, index) =>
                          item === "…" ? (
                            <PaginationEllipsis key={`ellipsis-${index}`} />
                          ) : (
                            <Button
                              key={item}
                              asChild
                              size="xs"
                              variant={item === data.page ? "primary" : "secondary"}
                              className="min-w-9 rounded-lg px-3"
                            >
                              <Link
                                aria-current={item === data.page ? "page" : undefined}
                                href={getDashboardV2CreatorResourcesHref({
                                  status: data.status,
                                  pricing: data.pricing,
                                  sort: data.sort,
                                  categoryId: data.categoryId,
                                  page: item,
                                })}
                              >
                                {item}
                              </Link>
                            </Button>
                          ),
                        )}
                        <Button
                          asChild
                          size="xs"
                          variant="secondary"
                          className="rounded-lg"
                        >
                          <Link
                            aria-disabled={data.page >= data.totalPages}
                            tabIndex={data.page >= data.totalPages ? -1 : undefined}
                            href={getDashboardV2CreatorResourcesHref({
                              status: data.status,
                              pricing: data.pricing,
                              sort: data.sort,
                              categoryId: data.categoryId,
                              page: Math.min(data.totalPages, data.page + 1),
                            })}
                            className={cn(
                              data.page >= data.totalPages &&
                                "pointer-events-none opacity-40",
                            )}
                          >
                            Next
                          </Link>
                        </Button>
                      </PaginationList>
                    </PaginationNav>
                  </div>
                ) : null}
              </>
            )}
          </DataPanelTable>
        </section>
      )}
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorResourcesLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-creator-resources">
      <DashboardV2RouteIntro
        action={
          <Button asChild>
            <Link href={routes.dashboardV2CreatorNewResource}>
              <Plus className="size-4" aria-hidden />
              New resource
            </Link>
          </Button>
        }
        eyebrow="Creator resources"
        title="Creator resources"
        description="Manage draft, published, and archived resources from one route-owned inventory."
        tone="featured"
      />

      <section className="space-y-4" data-loading-scope="dashboard-v2-creator-resources">
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} size="sm">
              <CardContent className="py-4">
                <LoadingSkeleton className="h-3 w-20" />
                <LoadingSkeleton className="mt-3 h-8 w-14" />
                <LoadingSkeleton className="mt-2 h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <LoadingSkeleton className="h-5 w-40" />
                  <LoadingSkeleton className="h-4 w-56 max-w-full" />
                </div>
                <div className="flex items-center gap-3">
                  <LoadingSkeleton className="h-8 w-24 rounded-full" />
                  <LoadingSkeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <LoadingSkeleton
                    key={index}
                    className="h-9 rounded-xl sm:h-10"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_128px_144px_128px_128px_128px_112px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-3 w-16" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_128px_144px_128px_128px_128px_112px] gap-4 border-b border-border-subtle px-5 py-4"
              >
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
                <LoadingSkeleton className="h-5 w-20 rounded-full" />
                <LoadingSkeleton className="h-4 w-16" />
                <LoadingSkeleton className="h-4 w-14" />
                <LoadingSkeleton className="h-4 w-14" />
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorResourceEditorContent({
  mode,
  resourceId,
  data,
}: {
  mode: "new" | "edit";
  resourceId?: string;
  data?: DashboardV2CreatorEditorData;
}) {
  const isEdit = mode === "edit";

  if (data?.state === "locked" || data?.state === "error") {
    return (
      <DashboardPageShell routeReady="dashboard-creator-resource-editor">
        <DashboardV2RouteIntro
          eyebrow="Creator editor"
          title={data.state === "locked" ? "Creator access" : "Editor"}
          description={
            data.state === "locked"
              ? "Creator access is required before opening resource editor routes."
              : "The resource editor could not load."
          }
          tone={data.state === "locked" ? "warning" : "featured"}
        />
        <DashboardV2ProtectedRouteEmptyState
          state={data}
          retryHref={
            isEdit
              ? routes.dashboardV2CreatorResource(resourceId ?? "sample")
              : routes.dashboardV2CreatorNewResource
          }
          icon={<FileText className="size-5 text-muted-foreground" aria-hidden />}
        />
      </DashboardPageShell>
    );
  }

  if (data?.state === "not-found" || data?.state === "forbidden") {
    return (
      <DashboardPageShell routeReady="dashboard-creator-resource-editor">
        <DashboardV2RouteIntro
          eyebrow="Creator editor"
          title={data.title}
          description={data.description}
          tone={data.state === "forbidden" ? "warning" : "featured"}
          action={
            <Button asChild variant="secondary">
              <Link href={routes.dashboardV2CreatorResources}>
                Back to resources
              </Link>
            </Button>
          }
        />
        <EmptyState
          icon={
            data.state === "forbidden" ? (
              <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
            ) : (
              <FileText className="size-5 text-muted-foreground" aria-hidden />
            )
          }
          title={data.title}
          description={data.description}
          action={
            <Button asChild>
              <Link href={routes.dashboardV2CreatorResources}>
                Open resource inventory
              </Link>
            </Button>
          }
          className="border-border-subtle py-20"
        />
      </DashboardPageShell>
    );
  }

  if (data?.state === "ready") {
    return (
      <DashboardPageShell routeReady="dashboard-creator-resource-editor">
        <DashboardV2RouteIntro
          eyebrow="Creator editor"
          title={data.title}
          description={data.description}
          tone="featured"
          action={
            isEdit ? (
              <Button asChild variant="secondary">
                <Link href={routes.dashboardV2CreatorResources}>
                  Back to resources
                </Link>
              </Button>
            ) : undefined
          }
        />
        <CreatorResourceForm
          mode={data.mode === "edit" ? "edit" : "create"}
          categories={data.categories}
          initialValues={data.mode === "edit" ? data.initialValues : undefined}
          initialAIDraft={data.mode === "edit" ? data.initialAIDraft : null}
          focusField={data.mode === "edit" ? data.focusField : undefined}
        />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell routeReady="dashboard-creator-resource-editor">
      <DashboardV2RouteIntro
        eyebrow="Creator editor"
        title={isEdit ? "Edit resource" : "New resource"}
        description={
          isEdit
            ? `Editing prototype resource ${resourceId ?? "sample"}.`
            : "Create route scaffold for the future resource upload flow."
        }
        tone="featured"
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="border-b border-border-subtle pb-4">
            <CardTitle>Resource details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-5">
            {[
              ["Title", isEdit ? "Biology Lab Safety Posters" : "Untitled resource"],
              ["Category", "Science"],
              ["Format", "PDF worksheet pack"],
              ["Status", isEdit ? "Published" : "Draft"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border-subtle bg-background px-4 py-3"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {value}
                </p>
              </div>
            ))}
            <Button disabled variant="secondary">
              Editor prototype only
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-border-subtle pb-4">
            <CardTitle>Upload checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 py-5">
            {["Metadata", "Preview file", "Protected download", "Review"].map(
              (step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-full border border-border-subtle bg-muted text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </div>
                  <p className="text-sm text-foreground">{step}</p>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorResourceEditorLoadingContent({
  mode,
}: {
  mode: "new" | "edit";
}) {
  const isEdit = mode === "edit";

  return (
    <DashboardPageShell routeReady="dashboard-creator-resource-editor">
      <DashboardV2RouteIntro
        eyebrow="Creator editor"
        title={isEdit ? "Edit resource" : "New resource"}
        description={
          isEdit
            ? "Update pricing, files, metadata, and previews for an existing resource."
            : "Create a protected resource draft, then add files, previews, and marketplace details."
        }
        tone="featured"
        action={
          isEdit ? (
            <Button asChild variant="secondary">
              <Link href={routes.dashboardV2CreatorResources}>
                Back to resources
              </Link>
            </Button>
          ) : undefined
        }
      />
      <section
        className="space-y-4"
        data-loading-scope="dashboard-v2-creator-editor"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader className="border-b border-border-subtle pb-4">
              <CardTitle>Resource details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 py-5">
              <div className="space-y-3">
                <LoadingSkeleton className="h-4 w-28" />
                <LoadingSkeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <LoadingSkeleton className="h-4 w-24" />
                    <LoadingSkeleton className="h-11 w-full rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-28 w-full rounded-2xl" />
              </div>
              <div className="space-y-3">
                <LoadingSkeleton className="h-4 w-36" />
                <LoadingSkeleton className="h-12 w-full rounded-2xl" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <LoadingSkeleton className="h-10 w-full rounded-xl" />
                <LoadingSkeleton className="h-10 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b border-border-subtle pb-4">
                <CardTitle>Delivery and previews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-5">
                <div className="flex flex-wrap gap-2">
                  <LoadingSkeleton className="h-9 w-28 rounded-xl" />
                  <LoadingSkeleton className="h-9 w-28 rounded-xl" />
                </div>
                <LoadingSkeleton className="h-24 w-full rounded-2xl" />
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LoadingSkeleton
                      key={index}
                      className="aspect-square w-full rounded-2xl"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border-subtle pb-4">
                <CardTitle>Upload checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <LoadingSkeleton className="size-7 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <LoadingSkeleton className="h-4 w-28" />
                      <LoadingSkeleton className="h-3 w-36" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </DashboardPageShell>
  );
}

type DashboardV2ProtectedRouteState =
  | {
      state: "locked";
      title: string;
      description: string;
      ctaHref: string;
      ctaLabel: string;
    }
  | {
      state: "error";
      title: string;
      description: string;
    };

function getDashboardV2StatusBadgeVariant(
  tone: "success" | "warning" | "neutral",
) {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  return "neutral";
}

function DashboardV2ProtectedRouteEmptyState({
  state,
  retryHref,
  icon,
}: {
  state: DashboardV2ProtectedRouteState;
  retryHref: string;
  icon: ReactNode;
}) {
  return (
    <EmptyState
      icon={icon}
      title={state.title}
      description={state.description}
      action={
        state.state === "locked" ? (
          <Button asChild size="sm">
            <Link href={state.ctaHref}>{state.ctaLabel}</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link href={retryHref}>Retry</Link>
          </Button>
        )
      }
      className="border-border-subtle py-16"
    />
  );
}

export function DashboardV2CreatorAnalyticsContent({
  data,
}: {
  data: DashboardV2CreatorAnalyticsData;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-creator-analytics">
      <DashboardV2RouteIntro
        eyebrow="Creator analytics"
        title="Analytics"
        description="Review top resources, recent sales, and download activity from one protected creator report."
        tone="featured"
      />

      {data.state === "locked" || data.state === "error" ? (
        <DashboardV2ProtectedRouteEmptyState
          state={data}
          retryHref={routes.dashboardV2CreatorAnalytics}
          icon={<BarChart3 className="size-5 text-muted-foreground" aria-hidden />}
        />
      ) : (
        <section className="space-y-4">
          <DashboardV2CreatorStats stats={data.stats} />

          <DataPanelTable
            title="Top resources"
            description="Best performers by creator share in the current analytics window."
            actions={
              <Button asChild size="sm" variant="secondary">
                <Link href={routes.dashboardV2CreatorResources}>Open resources</Link>
              </Button>
            }
            bodyClassName="p-0"
          >
            {data.topResources.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<FileText className="size-5 text-muted-foreground" aria-hidden />}
                  title="No resource performance yet"
                  description="Published resources with sales or downloads will appear here."
                  className="border-border-subtle py-16"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Resource
                      </th>
                      <th scope="col" className="w-36 px-5 py-3 font-medium">
                        Revenue
                      </th>
                      <th scope="col" className="w-28 px-5 py-3 font-medium">
                        Sales
                      </th>
                      <th scope="col" className="w-32 px-5 py-3 font-medium">
                        Downloads
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.topResources.map((resource) => (
                      <tr key={resource.id}>
                        <td className="max-w-0 px-5 py-4">
                          <Link
                            href={resource.href}
                            className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {resource.title}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                          {resource.revenueLabel}
                        </td>
                        <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                          {resource.salesLabel}
                        </td>
                        <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                          {resource.downloadsLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataPanelTable>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataPanelTable
              title="Recent sales"
              description="Latest creator orders feeding this analytics window."
              bodyClassName="p-0"
            >
              {data.recentSales.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={
                      <CircleDollarSign
                        className="size-5 text-muted-foreground"
                        aria-hidden
                      />
                    }
                    title="No sales yet"
                    description="Completed creator orders will appear here."
                    className="border-border-subtle py-16"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Resource
                        </th>
                        <th scope="col" className="w-40 px-5 py-3 font-medium">
                          Buyer
                        </th>
                        <th scope="col" className="w-28 px-5 py-3 font-medium">
                          Gross
                        </th>
                        <th scope="col" className="w-28 px-5 py-3 font-medium">
                          Share
                        </th>
                        <th scope="col" className="w-28 px-5 py-3 font-medium">
                          Status
                        </th>
                        <th scope="col" className="w-32 px-5 py-3 font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {data.recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="max-w-0 px-5 py-4">
                            <Link
                              href={sale.href}
                              className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                              {sale.title}
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {sale.buyerLabel}
                          </td>
                          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                            {sale.amountLabel}
                          </td>
                          <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                            {sale.shareLabel}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              className="w-fit"
                              variant={getDashboardV2StatusBadgeVariant(sale.statusTone)}
                            >
                              {sale.statusLabel}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {sale.dateLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DataPanelTable>

            <DataPanelTable
              title="Recent downloads"
              description="Latest learner download activity from creator resources."
              bodyClassName="p-0"
            >
              {data.recentDownloads.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={
                      <ArrowDownToLine
                        className="size-5 text-muted-foreground"
                        aria-hidden
                      />
                    }
                    title="No downloads yet"
                    description="Learner download activity will appear here."
                    className="border-border-subtle py-16"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Resource
                        </th>
                        <th scope="col" className="w-44 px-5 py-3 font-medium">
                          Learner
                        </th>
                        <th scope="col" className="w-32 px-5 py-3 font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {data.recentDownloads.map((download) => (
                        <tr key={download.id}>
                          <td className="max-w-0 px-5 py-4">
                            <Link
                              href={download.href}
                              className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                              {download.title}
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {download.actorLabel}
                          </td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {download.dateLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DataPanelTable>
          </div>
        </section>
      )}
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorAnalyticsLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-creator-analytics">
      <DashboardV2RouteIntro
        eyebrow="Creator analytics"
        title="Analytics"
        description="Review top resources, recent sales, and download activity from one protected creator report."
        tone="featured"
      />

      <section className="space-y-4" data-loading-scope="dashboard-v2-creator-analytics">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-3 w-24" />
                    <LoadingSkeleton className="h-8 w-16" />
                  </div>
                  <LoadingSkeleton className="size-9 rounded-xl" />
                </div>
                <LoadingSkeleton className="mt-5 h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-5">
            <div className="space-y-2">
              <LoadingSkeleton className="h-5 w-32" />
              <LoadingSkeleton className="h-4 w-60 max-w-full" />
            </div>
            <LoadingSkeleton className="hidden h-9 w-32 rounded-xl md:block" />
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_144px_112px_128px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <LoadingSkeleton key={index} className="h-3 w-16" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_144px_112px_128px] gap-4 border-b border-border-subtle px-5 py-4"
              >
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-4 w-14" />
                <LoadingSkeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, panelIndex) => (
            <div
              key={panelIndex}
              className="overflow-hidden rounded-xl border border-border-subtle bg-card"
            >
              <div className="border-b border-border-subtle px-5 py-5">
                <LoadingSkeleton className="h-5 w-32" />
                <LoadingSkeleton className="mt-2 h-4 w-56 max-w-full" />
              </div>
              <div className="overflow-x-auto">
                <div
                  className={cn(
                    "grid gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3",
                    panelIndex === 0
                      ? "min-w-[760px] grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px]"
                      : "min-w-[560px] grid-cols-[minmax(0,1fr)_176px_128px]",
                  )}
                >
                  {Array.from({ length: panelIndex === 0 ? 6 : 3 }).map((__, index) => (
                    <LoadingSkeleton key={index} className="h-3 w-16" />
                  ))}
                </div>
                {Array.from({ length: 4 }).map((__, index) => (
                  <div
                    key={index}
                    className={cn(
                      "grid gap-4 border-b border-border-subtle px-5 py-4",
                      panelIndex === 0
                        ? "min-w-[760px] grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px]"
                        : "min-w-[560px] grid-cols-[minmax(0,1fr)_176px_128px]",
                    )}
                  >
                    <LoadingSkeleton className="h-4 w-3/4" />
                    <LoadingSkeleton className="h-4 w-24" />
                    {panelIndex === 0 ? (
                      <>
                        <LoadingSkeleton className="h-4 w-16" />
                        <LoadingSkeleton className="h-4 w-16" />
                        <LoadingSkeleton className="h-5 w-20 rounded-full" />
                        <LoadingSkeleton className="h-4 w-20" />
                      </>
                    ) : (
                      <LoadingSkeleton className="h-4 w-20" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardPageShell>
  );
}

function DashboardV2CreatorEarningsPanels({
  data,
  focus = "sales",
}: {
  data: Extract<DashboardV2CreatorEarningsData, { state: "ready" }>;
  focus?: "sales" | "payouts";
}) {
  const sections =
    focus === "payouts"
      ? [
          {
            id: "creator-earnings-payouts",
            title: "Payout history",
            description: "Latest payout transfers and their current settlement state.",
            panel: (
              <DataPanelTable title="Payout history" bodyClassName="p-0">
                {data.payouts.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={
                        <CircleDollarSign
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                      }
                      title="No payouts yet"
                      description="Payout history will appear after the first transfer is issued."
                      className="border-border-subtle py-16"
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                      <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Amount
                          </th>
                          <th scope="col" className="w-32 px-5 py-3 font-medium">
                            Status
                          </th>
                          <th scope="col" className="w-32 px-5 py-3 font-medium">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.payouts.map((payout) => (
                          <tr key={payout.id}>
                            <td className="px-5 py-4 text-sm font-semibold tabular-nums text-foreground">
                              {payout.amountLabel}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                className="w-fit"
                                variant={getDashboardV2StatusBadgeVariant(payout.statusTone)}
                              >
                                {payout.statusLabel}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">
                              {payout.dateLabel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DataPanelTable>
            ),
          },
          {
            id: "creator-earnings-sales",
            title: "Sales ledger",
            description: "Order-level gross revenue and creator share for the current ledger.",
            panel: (
              <DataPanelTable title="Sales ledger" bodyClassName="p-0">
                {data.sales.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={
                        <ReceiptText
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                      }
                      title="No sales yet"
                      description="Order-level creator sales will appear here once purchases complete."
                      className="border-border-subtle py-16"
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left">
                      <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Resource
                          </th>
                          <th scope="col" className="w-40 px-5 py-3 font-medium">
                            Buyer
                          </th>
                          <th scope="col" className="w-28 px-5 py-3 font-medium">
                            Gross
                          </th>
                          <th scope="col" className="w-28 px-5 py-3 font-medium">
                            Share
                          </th>
                          <th scope="col" className="w-28 px-5 py-3 font-medium">
                            Status
                          </th>
                          <th scope="col" className="w-32 px-5 py-3 font-medium">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="max-w-0 px-5 py-4">
                              <Link
                                href={sale.href}
                                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                              >
                                {sale.title}
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">
                              {sale.buyerLabel}
                            </td>
                            <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                              {sale.grossLabel}
                            </td>
                            <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                              {sale.shareLabel}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                className="w-fit"
                                variant={getDashboardV2StatusBadgeVariant(sale.statusTone)}
                              >
                                {sale.statusLabel}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">
                              {sale.dateLabel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DataPanelTable>
            ),
          },
        ]
      : [
          {
            id: "creator-earnings-sales",
            title: "Sales ledger",
            description: "Order-level gross revenue and creator share for the current ledger.",
            panel: (
              <DataPanelTable title="Sales ledger" bodyClassName="p-0">
                {data.sales.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={
                        <ReceiptText
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                      }
                      title="No sales yet"
                      description="Order-level creator sales will appear here once purchases complete."
                      className="border-border-subtle py-16"
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left">
                      <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Resource
                          </th>
                          <th scope="col" className="w-40 px-5 py-3 font-medium">
                            Buyer
                          </th>
                          <th scope="col" className="w-28 px-5 py-3 font-medium">
                            Gross
                          </th>
                          <th scope="col" className="w-28 px-5 py-3 font-medium">
                            Share
                          </th>
                          <th scope="col" className="w-28 px-5 py-3 font-medium">
                            Status
                          </th>
                          <th scope="col" className="w-32 px-5 py-3 font-medium">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="max-w-0 px-5 py-4">
                              <Link
                                href={sale.href}
                                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
                              >
                                {sale.title}
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">
                              {sale.buyerLabel}
                            </td>
                            <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                              {sale.grossLabel}
                            </td>
                            <td className="px-5 py-4 text-sm tabular-nums text-muted-foreground">
                              {sale.shareLabel}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                className="w-fit"
                                variant={getDashboardV2StatusBadgeVariant(sale.statusTone)}
                              >
                                {sale.statusLabel}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">
                              {sale.dateLabel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DataPanelTable>
            ),
          },
          {
            id: "creator-earnings-payouts",
            title: "Payout history",
            description: "Latest payout transfers and their current settlement state.",
            panel: (
              <DataPanelTable title="Payout history" bodyClassName="p-0">
                {data.payouts.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={
                        <CircleDollarSign
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                      }
                      title="No payouts yet"
                      description="Payout history will appear after the first transfer is issued."
                      className="border-border-subtle py-16"
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                      <thead className="border-b border-border-subtle bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Amount
                          </th>
                          <th scope="col" className="w-32 px-5 py-3 font-medium">
                            Status
                          </th>
                          <th scope="col" className="w-32 px-5 py-3 font-medium">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.payouts.map((payout) => (
                          <tr key={payout.id}>
                            <td className="px-5 py-4 text-sm font-semibold tabular-nums text-foreground">
                              {payout.amountLabel}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                className="w-fit"
                                variant={getDashboardV2StatusBadgeVariant(payout.statusTone)}
                              >
                                {payout.statusLabel}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">
                              {payout.dateLabel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DataPanelTable>
            ),
          },
        ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-ui text-2xl font-semibold text-foreground">
              {section.title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          </div>
          {section.panel}
        </section>
      ))}
    </div>
  );
}

function DashboardV2CreatorEarningsRouteIntro({
  focus = "sales",
}: {
  focus?: "sales" | "payouts";
}) {
  return (
    <DashboardV2RouteIntro
      eyebrow={focus === "payouts" ? "Creator payouts" : "Creator earnings"}
      title={focus === "payouts" ? "Payouts" : "Earnings"}
      description="Sales performance, creator share, and payout state live in one protected revenue surface."
      tone="featured"
    />
  );
}

function DashboardV2CreatorEarningsCards({
  cards,
}: {
  cards: ReadonlyArray<{ label: string; value: string; detail: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardContent className="py-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 font-ui text-2xl font-semibold text-foreground">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DashboardV2CreatorEarningsUnavailableState({
  data,
  focus = "sales",
}: {
  data: Extract<DashboardV2CreatorEarningsData, { state: "locked" | "error" }>;
  focus?: "sales" | "payouts";
}) {
  return (
    <DashboardV2ProtectedRouteEmptyState
      state={data}
      retryHref={
        focus === "payouts"
          ? routes.dashboardV2CreatorPayouts
          : routes.dashboardV2CreatorSales
      }
      icon={<CircleDollarSign className="size-5 text-muted-foreground" aria-hidden />}
    />
  );
}

function DashboardV2CreatorEarningsCombinedContent({
  data,
  focus = "sales",
}: {
  data: DashboardV2CreatorEarningsData;
  focus?: "sales" | "payouts";
}) {
  const routeReady =
    focus === "payouts" ? "dashboard-creator-payouts" : "dashboard-creator-sales";

  return (
    <div data-route-shell-ready={routeReady} className="space-y-4">
      <DashboardV2CreatorEarningsRouteIntro focus={focus} />

      {data.state !== "ready" ? (
        <DashboardV2CreatorEarningsUnavailableState data={data} focus={focus} />
      ) : (
        <section className="space-y-4">
          <DashboardV2CreatorEarningsCards cards={data.cards} />
          <DashboardV2CreatorEarningsPanels data={data} focus={focus} />
        </section>
      )}
    </div>
  );
}

export function DashboardV2CreatorSalesContent({
  data,
}: {
  data: DashboardV2CreatorEarningsData;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-creator-sales">
      <DashboardV2CreatorEarningsCombinedContent data={data} focus="sales" />
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorPayoutsContent({
  data,
}: {
  data: DashboardV2CreatorEarningsData;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-creator-payouts">
      <DashboardV2CreatorEarningsCombinedContent data={data} focus="payouts" />
    </DashboardPageShell>
  );
}

function DashboardV2CreatorEarningsSummaryLoadingContent({
  focus = "sales",
}: {
  focus?: "sales" | "payouts";
}) {
  const loadingScope =
    focus === "payouts" ? "dashboard-v2-creator-payouts" : "dashboard-v2-creator-sales";

  return (
    <section className="space-y-4" data-loading-scope={loadingScope}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardContent className="py-4">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="mt-3 h-8 w-20" />
              <LoadingSkeleton className="mt-2 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function DashboardV2CreatorEarningsPanelsLoadingContent({
  focus = "sales",
}: {
  focus?: "sales" | "payouts";
}) {
  const loadingScope =
    focus === "payouts" ? "dashboard-v2-creator-payouts" : "dashboard-v2-creator-sales";
  const sections =
    focus === "payouts"
      ? [
          {
            id: "creator-earnings-payouts",
            titleWidth: "w-40",
            descriptionWidth: "w-80 max-w-full",
            minWidthClass: "min-w-[520px]",
            columnsClass: "grid-cols-[minmax(0,1fr)_128px_128px]",
            headerWidths: ["w-16", "w-16", "w-16"],
            rowSkeletons: ["h-4 w-24", "h-5 w-20 rounded-full", "h-4 w-20"],
            rowCount: 4,
          },
          {
            id: "creator-earnings-sales",
            titleWidth: "w-36",
            descriptionWidth: "w-96 max-w-full",
            minWidthClass: "min-w-[860px]",
            columnsClass:
              "grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px]",
            headerWidths: ["w-16", "w-16", "w-16", "w-16", "w-16", "w-16"],
            rowSkeletons: [
              "h-4 w-3/4",
              "h-4 w-24",
              "h-4 w-16",
              "h-4 w-16",
              "h-5 w-20 rounded-full",
              "h-4 w-20",
            ],
            rowCount: 5,
          },
        ]
      : [
          {
            id: "creator-earnings-sales",
            titleWidth: "w-36",
            descriptionWidth: "w-96 max-w-full",
            minWidthClass: "min-w-[860px]",
            columnsClass:
              "grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px]",
            headerWidths: ["w-16", "w-16", "w-16", "w-16", "w-16", "w-16"],
            rowSkeletons: [
              "h-4 w-3/4",
              "h-4 w-24",
              "h-4 w-16",
              "h-4 w-16",
              "h-5 w-20 rounded-full",
              "h-4 w-20",
            ],
            rowCount: 5,
          },
          {
            id: "creator-earnings-payouts",
            titleWidth: "w-40",
            descriptionWidth: "w-80 max-w-full",
            minWidthClass: "min-w-[520px]",
            columnsClass: "grid-cols-[minmax(0,1fr)_128px_128px]",
            headerWidths: ["w-16", "w-16", "w-16"],
            rowSkeletons: ["h-4 w-24", "h-5 w-20 rounded-full", "h-4 w-20"],
            rowCount: 4,
          },
        ];

  return (
    <section className="space-y-4" data-loading-scope={loadingScope}>
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="space-y-2">
              <LoadingSkeleton className={`h-8 ${section.titleWidth}`} />
              <LoadingSkeleton className={`h-4 ${section.descriptionWidth}`} />
            </div>

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
              <div className="border-b border-border-subtle px-5 py-5">
                <LoadingSkeleton className="h-5 w-32" />
              </div>
              <div className="overflow-x-auto">
                <div
                  className={`grid ${section.minWidthClass} ${section.columnsClass} gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3`}
                >
                  {section.headerWidths.map((width, index) => (
                    <LoadingSkeleton key={index} className={`h-3 ${width}`} />
                  ))}
                </div>
                {Array.from({ length: section.rowCount }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={`grid ${section.minWidthClass} ${section.columnsClass} gap-4 border-b border-border-subtle px-5 py-4`}
                  >
                    {section.rowSkeletons.map((rowClass, cellIndex) => (
                      <LoadingSkeleton key={cellIndex} className={rowClass} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function DashboardV2CreatorEarningsLoadingContent({
  focus = "sales",
}: {
  focus?: "sales" | "payouts";
}) {
  const routeReady =
    focus === "payouts" ? "dashboard-creator-payouts" : "dashboard-creator-sales";

  return (
    <DashboardPageShell routeReady={routeReady}>
      <DashboardV2CreatorEarningsRouteIntro focus={focus} />
      <section className="space-y-4">
        <DashboardV2CreatorEarningsSummaryLoadingContent focus={focus} />
        <DashboardV2CreatorEarningsPanelsLoadingContent focus={focus} />
      </section>
    </DashboardPageShell>
  );
}

function DashboardV2CreatorProfileRouteContent({
  data,
}: {
  data: Extract<DashboardV2CreatorProfileData, { state: "ready" }>;
}) {
  return (
    <section className="space-y-4">
      <CreatorProfileForm profile={data.profile} />
    </section>
  );
}

export function DashboardV2CreatorProfileContent({
  data,
}: {
  data: DashboardV2CreatorProfileData;
}) {
  return (
    <DashboardPageShell routeReady="dashboard-creator-profile">
      <DashboardV2RouteIntro
        eyebrow="Creator profile"
        title="Profile"
        description="Edit the public identity learners see across your storefront and creator listings."
        tone="featured"
      />

      {data.state === "locked" || data.state === "error" ? (
        <DashboardV2ProtectedRouteEmptyState
          state={data}
          retryHref={routes.dashboardV2CreatorProfile}
          icon={<Settings className="size-5 text-muted-foreground" aria-hidden />}
        />
      ) : (
        <DashboardV2CreatorProfileRouteContent data={data} />
      )}
    </DashboardPageShell>
  );
}

export function DashboardV2CreatorProfileLoadingContent() {
  return (
    <DashboardPageShell routeReady="dashboard-creator-profile">
      <DashboardV2RouteIntro
        eyebrow="Creator profile"
        title="Profile"
        description="Edit the public identity learners see across your storefront and creator listings."
        tone="featured"
      />

      <div className="space-y-4" data-loading-scope="dashboard-v2-creator-profile">
        <div className="rounded-2xl border border-border-subtle bg-secondary px-5 py-4 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <LoadingSkeleton className="h-5 w-32" />
                <LoadingSkeleton className="h-4 w-72" />
              </div>
              <div className="space-y-2">
                <LoadingSkeleton className="h-2 w-full rounded-full" />
                <LoadingSkeleton className="h-4 w-28" />
              </div>
            </div>
            <LoadingSkeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border-subtle bg-card p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <LoadingSkeleton className="h-5 w-32" />
                <div className="space-y-5">
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-4 w-64" />
                    <LoadingSkeleton className="h-14 rounded-xl" />
                    <LoadingSkeleton className="h-14 rounded-xl" />
                    <LoadingSkeleton className="h-16 max-w-md rounded-xl" />
                    <LoadingSkeleton className="h-36 rounded-xl" />
                    <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_minmax(0,280px)]">
                      <div className="space-y-2">
                        <LoadingSkeleton className="h-4 w-20" />
                        <LoadingSkeleton className="h-4 w-40" />
                      </div>
                      <LoadingSkeleton className="h-14 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border-subtle pt-6">
                    <LoadingSkeleton className="h-4 w-24" />
                    <LoadingSkeleton className="h-4 w-80" />
                    <div className="rounded-xl border border-border-subtle bg-muted p-4">
                      <div className="divide-y divide-border-subtle lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <div
                            key={index}
                            className={
                              index === 0
                                ? "space-y-4 pb-5 lg:pb-0 lg:pr-6"
                                : "space-y-4 pt-5 lg:pt-0 lg:pl-6"
                            }
                          >
                            <LoadingSkeleton className="h-4 w-28" />
                            <LoadingSkeleton className="h-14 rounded-xl" />
                            <div className="flex gap-2">
                              <LoadingSkeleton className="h-9 w-28 rounded-xl" />
                              <LoadingSkeleton className="h-9 w-20 rounded-xl" />
                            </div>
                            <LoadingSkeleton className="h-3 w-36" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 space-y-4 border-t border-border-subtle pt-6">
                        <div className="rounded-xl border border-border-subtle bg-card p-4">
                          <div className="grid gap-4 sm:grid-cols-[80px_minmax(0,1fr)]">
                            <LoadingSkeleton className="h-20 w-20 rounded-xl" />
                            <div className="space-y-3">
                              <LoadingSkeleton className="h-5 w-36" />
                              <LoadingSkeleton className="h-4 w-full max-w-[220px]" />
                              <LoadingSkeleton className="h-5 w-24" />
                            </div>
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
                          <LoadingSkeleton className="h-48 rounded-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <LoadingSkeleton className="h-5 w-28" />
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 5 }).map((_, index, items) => (
                    <LoadingSkeleton
                      key={index}
                      className={`h-16 rounded-xl ${index === items.length - 1 ? "md:col-span-2" : ""}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-border-subtle pt-6">
                <LoadingSkeleton className="h-4 w-48" />
                <LoadingSkeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </div>
      </div>
    </DashboardPageShell>
  );
}
