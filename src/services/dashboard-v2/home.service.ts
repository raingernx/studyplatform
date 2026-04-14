import { formatDate, formatPrice, formatRelativeDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getUserDownloadCount,
  getUserDownloadHistory,
  getUserPurchases,
} from "@/services/purchases/purchase.service";
import { getUserMembershipOverview } from "@/services/subscriptions/subscription.service";

export type DashboardV2HomeStatKey =
  | "library"
  | "downloads"
  | "purchases"
  | "membership";

export interface DashboardV2HomeStatItem {
  key: DashboardV2HomeStatKey;
  label: string;
  value: string;
  detail: string;
  isError?: boolean;
}

export interface DashboardV2HomeContinueLearningItem {
  id: string;
  href: string;
  title: string;
  meta: string;
  secondaryLabel: string;
  statusLabel: string;
  statusVariant: "neutral" | "new";
  previewUrl: string | null;
}

export interface DashboardV2HomeActivityItem {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  timestamp: number;
  kind: "download" | "purchase";
}

export interface DashboardV2HomeMembershipSnapshot {
  badgeLabel: string;
  badgeVariant: "neutral" | "success" | "warning";
  title: string;
  detail: string;
  support: string;
  ctaHref: string;
  ctaLabel: string;
}

type ReadyState<T> = {
  status: "ready";
  data: T;
};

type EmptyState = {
  status: "empty";
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

type ErrorState = {
  status: "error";
  title: string;
  description: string;
};

export type DashboardV2HomeSurfaceState<T> =
  | ReadyState<T>
  | EmptyState
  | ErrorState;

export interface DashboardV2HomeData {
  firstName: string;
  stats: DashboardV2HomeStatItem[];
  continueLearning: DashboardV2HomeSurfaceState<
    DashboardV2HomeContinueLearningItem[]
  >;
  recentActivity: DashboardV2HomeSurfaceState<DashboardV2HomeActivityItem[]>;
  membership: DashboardV2HomeSurfaceState<DashboardV2HomeMembershipSnapshot>;
}

function getFirstName(displayName: string | null | undefined) {
  const trimmed = displayName?.trim();
  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0] ?? "there";
}

function humanizePlan(plan: string | null | undefined) {
  if (!plan) {
    return "Free";
  }

  return plan
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getMembershipSnapshot(params: {
  purchaseCount: number;
  fallbackStatus: string | null;
  membershipOverview:
    | Awaited<ReturnType<typeof getUserMembershipOverview>>
    | null;
}): DashboardV2HomeMembershipSnapshot {
  const { purchaseCount, fallbackStatus, membershipOverview } = params;
  const status =
    membershipOverview?.subscriptionStatus ?? fallbackStatus ?? "INACTIVE";
  const normalizedStatus = status.toUpperCase();
  const isPaidPlan =
    normalizedStatus === "ACTIVE" || normalizedStatus === "TRIALING";
  const badgeVariant =
    normalizedStatus === "ACTIVE" || normalizedStatus === "TRIALING"
      ? "success"
      : normalizedStatus === "PAST_DUE" || normalizedStatus === "CANCELED"
        ? "warning"
        : "neutral";
  const badgeLabel =
    normalizedStatus === "ACTIVE"
      ? "Active"
      : normalizedStatus === "TRIALING"
        ? "Trial"
        : normalizedStatus === "PAST_DUE"
          ? "Action needed"
          : normalizedStatus === "CANCELED"
            ? "Ending"
            : "Free";
  const title = isPaidPlan
    ? `${humanizePlan(membershipOverview?.subscriptionPlan)} membership`
    : "Free plan";
  const detail = membershipOverview?.currentPeriodEnd
    ? `${
        normalizedStatus === "TRIALING" ? "Trial ends" : "Renews"
      } ${formatDate(membershipOverview.currentPeriodEnd)}`
    : isPaidPlan
      ? "Unlimited access is active."
      : `${purchaseCount} owned resource${
          purchaseCount === 1 ? "" : "s"
        } on the free plan.`;
  const support = isPaidPlan
    ? "Billing, renewal, and cancellation live in Membership."
    : "Upgrade when you need unlimited access or faster discovery.";

  return {
    badgeLabel,
    badgeVariant,
    title,
    detail,
    support,
    ctaHref: routes.dashboardV2Membership,
    ctaLabel: isPaidPlan ? "Manage membership" : "Explore membership",
  };
}

export async function getDashboardV2HomeData(input: {
  userId: string;
  displayName?: string | null;
  fallbackSubscriptionStatus?: string | null;
}): Promise<DashboardV2HomeData> {
  const [purchasesResult, downloadCountResult, downloadsResult, membershipResult] =
    await Promise.all([
      getUserPurchases(input.userId)
        .then((data) => ({ status: "fulfilled" as const, data }))
        .catch((error) => ({ status: "rejected" as const, error })),
      getUserDownloadCount(input.userId)
        .then((data) => ({ status: "fulfilled" as const, data }))
        .catch((error) => ({ status: "rejected" as const, error })),
      getUserDownloadHistory(input.userId, 4)
        .then((data) => ({ status: "fulfilled" as const, data }))
        .catch((error) => ({ status: "rejected" as const, error })),
      getUserMembershipOverview(input.userId)
        .then((data) => ({ status: "fulfilled" as const, data }))
        .catch((error) => ({ status: "rejected" as const, error })),
    ]);

  const purchases =
    purchasesResult.status === "fulfilled" ? purchasesResult.data : null;
  const recentDownloads =
    downloadsResult.status === "fulfilled" ? downloadsResult.data : null;
  const membershipOverview =
    membershipResult.status === "fulfilled" ? membershipResult.data : null;
  const downloadsCount =
    downloadCountResult.status === "fulfilled" ? downloadCountResult.data : null;
  const safeDownloadsCount = downloadsCount ?? 0;
  const safePurchases = purchases ?? [];

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const purchasesThisWeek =
    purchases?.filter((purchase) => purchase.createdAt.getTime() >= weekAgo)
      .length ?? 0;
  const totalSpent =
    purchases?.reduce((sum, purchase) => sum + purchase.amount, 0) ?? 0;
  const membershipSnapshot = getMembershipSnapshot({
    purchaseCount: purchases?.length ?? 0,
    fallbackStatus: input.fallbackSubscriptionStatus ?? null,
    membershipOverview,
  });

  const stats: DashboardV2HomeStatItem[] = [
    {
      key: "library",
      label: "Owned resources",
      value: purchases ? String(purchases.length) : "—",
      detail:
        purchasesResult.status === "fulfilled"
          ? `${purchasesThisWeek} added this week`
          : "Could not load library summary",
      isError: purchasesResult.status !== "fulfilled",
    },
    {
      key: "downloads",
      label: "Downloads",
      value: downloadsCount !== null ? String(downloadsCount) : "—",
      detail:
        downloadCountResult.status === "fulfilled"
          ? safeDownloadsCount > 0
            ? `${Math.min(safeDownloadsCount, 4)} recent download${
                safeDownloadsCount === 1 ? "" : "s"
              }`
            : "No downloads yet"
          : "Could not load download summary",
      isError: downloadCountResult.status !== "fulfilled",
    },
    {
      key: "purchases",
      label: "Purchases",
      value: purchases ? formatPrice(totalSpent / 100) : "—",
      detail:
        purchasesResult.status === "fulfilled"
          ? `${safePurchases.length} completed purchase${
              safePurchases.length === 1 ? "" : "s"
            }`
          : "Could not load purchase summary",
      isError: purchasesResult.status !== "fulfilled",
    },
    {
      key: "membership",
      label: "Membership",
      value: membershipSnapshot.badgeLabel === "Free" ? "Free" : "Pro",
      detail:
        membershipResult.status === "fulfilled"
          ? membershipSnapshot.detail
          : "Could not load membership status",
      isError: membershipResult.status !== "fulfilled",
    },
  ];

  const continueLearning: DashboardV2HomeData["continueLearning"] =
    purchasesResult.status !== "fulfilled"
      ? {
          status: "error",
          title: "Continue learning is unavailable",
          description:
            "We could not load your library right now. Open Library and try again.",
        }
      : safePurchases.length === 0
        ? {
            status: "empty",
            title: "No library items yet",
            description:
              "Your purchased resources will appear here once you start building your library.",
            ctaHref: routes.marketplace,
            ctaLabel: "Browse resources",
          }
        : {
            status: "ready",
            data: safePurchases.slice(0, 3).map((purchase) => ({
              id: purchase.id,
              href: routes.resource(purchase.resource.slug),
              title: purchase.resource.title,
              meta:
                purchase.resource.category?.name ??
                purchase.resource.author?.name ??
                "Resource",
              secondaryLabel: `Added ${formatDate(purchase.createdAt)}`,
              statusLabel:
                purchase.createdAt.getTime() >= weekAgo ? "New" : "Ready",
              statusVariant:
                purchase.createdAt.getTime() >= weekAgo ? "new" : "neutral",
              previewUrl: purchase.resource.previewUrl ?? null,
            })),
          };

  const activityItems = [
    ...(recentDownloads?.map((download) => ({
      id: `download-${download.id}`,
      title: `${download.resource.title} downloaded`,
      detail: download.resource.isFree
        ? "Library download ready"
        : "Protected file delivered",
      timeLabel: formatRelativeDate(download.createdAt),
      timestamp: download.createdAt.getTime(),
      kind: "download" as const,
    })) ?? []),
    ...(purchases?.slice(0, 4).map((purchase) => ({
      id: `purchase-${purchase.id}`,
      title: `${purchase.resource.title} purchased`,
      detail: purchase.resource.isFree
        ? "Added to your library"
        : `${formatPrice(purchase.amount / 100)} purchase completed`,
      timeLabel: formatRelativeDate(purchase.createdAt),
      timestamp: purchase.createdAt.getTime(),
      kind: "purchase" as const,
    })) ?? []),
  ]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 4);

  const recentActivity: DashboardV2HomeData["recentActivity"] =
    purchasesResult.status !== "fulfilled" &&
    downloadsResult.status !== "fulfilled"
      ? {
          status: "error",
          title: "Recent activity is unavailable",
          description:
            "We could not load your latest downloads and purchases right now.",
        }
      : activityItems.length === 0
        ? {
            status: "empty",
            title: "No recent activity yet",
            description:
              "Downloads and purchases will show up here after you start using your library.",
            ctaHref: routes.marketplace,
            ctaLabel: "Browse resources",
          }
        : {
            status: "ready",
            data: activityItems,
          };

  const membership: DashboardV2HomeData["membership"] =
    membershipResult.status !== "fulfilled"
      ? {
          status: "error",
          title: "Membership is unavailable",
          description:
            "We could not load your plan status right now. Open Membership and try again.",
        }
      : {
          status: "ready",
          data: membershipSnapshot,
        };

  return {
    firstName: getFirstName(input.displayName),
    stats,
    continueLearning,
    recentActivity,
    membership,
  };
}
