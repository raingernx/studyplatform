import { formatNumber, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  canAccessCreatorWorkspace,
  type CreatorAccessState,
  getCreatorAccessState,
  getCreatorOverview,
  getCreatorProfile,
  getCreatorResourceManagementDataForWorkspace,
} from "@/services/creator";

export type DashboardV2CreatorStatKey = "revenue" | "resources" | "downloads";

export interface DashboardV2CreatorStatItem {
  key: DashboardV2CreatorStatKey;
  label: string;
  value: string;
  detail: string;
}

export interface DashboardV2CreatorLinkItem {
  title: string;
  detail: string;
  href: string;
  key: "resources" | "earnings" | "analytics" | "storefront";
}

export interface DashboardV2CreatorChecklistItem {
  label: string;
  detail: string;
  done: boolean;
}

export interface DashboardV2CreatorResourceRow {
  id: string;
  title: string;
  href: string;
  status: string;
  salesLabel: string;
  downloadsLabel: string;
}

export interface DashboardV2CreatorProfileSummary {
  displayName: string;
  slugLabel: string;
  publicProfileHref: string | null;
  bio: string;
  statusLabel: string;
  avatarUrl: string | null;
  avatarInitial: string;
  hasBio: boolean;
  hasSlug: boolean;
  hasDisplayName: boolean;
}

type DashboardV2CreatorOverviewUnavailableData =
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

export type DashboardV2CreatorOverviewData =
  | {
      state: "ready";
      creatorName: string;
      activationStage: "first-run" | "active";
      stats: DashboardV2CreatorStatItem[];
      links: DashboardV2CreatorLinkItem[];
      checklist: DashboardV2CreatorChecklistItem[];
      totalResourceCount: number;
      resources: DashboardV2CreatorResourceRow[];
      profile: DashboardV2CreatorProfileSummary;
    }
  | DashboardV2CreatorOverviewUnavailableData;

function formatMoneyCents(value: number) {
  return formatPrice(value / 100);
}

function toCreatorStatusLabel(status: string | null | undefined) {
  if (!status) return "Inactive";

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toAvatarInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "C";
}

function getLockedWorkspaceData(): Extract<
  DashboardV2CreatorOverviewUnavailableData,
  { state: "locked" }
> {
  return {
    state: "locked",
    title: "Creator access is not active",
    description:
      "Apply for creator access before managing resources, earnings, and storefront settings.",
    ctaHref: routes.dashboardV2CreatorApply,
    ctaLabel: "Apply for creator access",
  };
}

function getErrorWorkspaceData(): Extract<
  DashboardV2CreatorOverviewUnavailableData,
  { state: "error" }
> {
  return {
    state: "error",
    title: "Could not load creator workspace",
    description:
      "Try refreshing this route. Creator data remains protected behind the dashboard session gate.",
  };
}

async function resolveCreatorWorkspaceAccess(
  input: { userId: string; access?: CreatorAccessState },
) {
  return input.access ?? getCreatorAccessState(input.userId);
}

export async function getDashboardV2CreatorOverviewData(
  userId: string,
  options: {
    access?: CreatorAccessState;
  } = {},
): Promise<DashboardV2CreatorOverviewData> {
  try {
    const access = await resolveCreatorWorkspaceAccess({
      userId,
      access: options.access,
    });

    if (!canAccessCreatorWorkspace(access)) {
      return getLockedWorkspaceData();
    }

    const [overview, profile, resourceData] = await Promise.all([
      getCreatorOverview(userId, { skipAccessCheck: true }),
      getCreatorProfile(userId),
      getCreatorResourceManagementDataForWorkspace(userId, { sort: "latest" }),
    ]);

    const displayName =
      profile?.creatorDisplayName?.trim() ||
      profile?.name?.trim() ||
      "Creator workspace";
    const hasDisplayName = Boolean(profile?.creatorDisplayName?.trim());
    const hasSlug = Boolean(profile?.creatorSlug?.trim());
    const hasBio = Boolean(profile?.creatorBio?.trim());
    const storefrontBasicsReady = hasDisplayName && hasSlug;
    const storefrontReady = storefrontBasicsReady && hasBio;
    const firstResourceCreated = overview.totals.totalResources > 0;
    const firstResourcePublished = overview.totals.publishedResources > 0;
    const draftResources =
      overview.totals.totalResources - overview.totals.publishedResources;
    const firstTimeCreator = overview.totals.totalResources === 0;

    return {
      state: "ready",
      creatorName: displayName,
      activationStage: firstTimeCreator ? "first-run" : "active",
      stats: [
        {
          key: "revenue",
          label: "Revenue",
          value: formatMoneyCents(overview.totals.creatorShare),
          detail: firstResourcePublished
            ? `${formatMoneyCents(overview.totals.grossRevenue)} gross`
            : "Creator share starts after your first published sale",
        },
        {
          key: "resources",
          label: "Resources",
          value: String(overview.totals.totalResources),
          detail: firstResourceCreated
            ? draftResources > 0
              ? `${draftResources} draft${draftResources === 1 ? "" : "s"} waiting`
              : `${overview.totals.publishedResources} published`
            : "Create your first listing to start your catalog",
        },
        {
          key: "downloads",
          label: "Downloads",
          value: formatNumber(overview.totals.totalDownloads),
          detail:
            overview.totals.totalDownloads > 0
              ? `${formatNumber(
                  overview.totals.downloadsLast30Days,
                )} in 30 days`
              : "Downloads appear after learners purchase resources",
        },
      ],
      links: [
        {
          key: "resources",
          title: "Resources",
          detail: firstResourceCreated
            ? `${overview.totals.totalResources} total · ${overview.totals.publishedResources} published`
            : "Create and organize your first listing",
          href: routes.dashboardV2CreatorResources,
        },
        {
          key: "earnings",
          title: "Earnings",
          detail:
            overview.totals.creatorShare > 0
              ? `${formatMoneyCents(overview.totals.creatorShare)} creator share`
              : "Sales and payouts appear after your first order",
          href: routes.dashboardV2CreatorSales,
        },
        {
          key: "analytics",
          title: "Analytics",
          detail:
            overview.totals.totalDownloads > 0
              ? `${formatNumber(overview.totals.totalDownloads)} downloads`
              : "Performance insights unlock as your store gets activity",
          href: routes.dashboardV2CreatorAnalytics,
        },
        {
          key: "storefront",
          title: "Storefront",
          detail: storefrontReady
            ? "Preview your public storefront"
            : storefrontBasicsReady
              ? "Add a short bio before you share it"
              : "Finish your public storefront basics",
          href: profile?.creatorSlug
            ? routes.creatorPublicProfile(profile.creatorSlug)
            : routes.dashboardV2CreatorProfile,
        },
      ],
      checklist: [
        {
          label: "Storefront profile",
          detail: storefrontReady
            ? "Name, slug, and bio are ready"
            : storefrontBasicsReady
              ? "Add a short bio before you publish"
              : "Add your public name and URL",
          done: storefrontReady,
        },
        {
          label: "First resource",
          detail: firstResourceCreated ? "Inventory started" : "Create a resource",
          done: firstResourceCreated,
        },
        {
          label: "First published listing",
          detail: firstResourcePublished ? "Live in catalog" : "Publish when ready",
          done: firstResourcePublished,
        },
      ],
      totalResourceCount: overview.totals.totalResources,
      resources: resourceData.resources.slice(0, 6).map((resource) => ({
        id: resource.id,
        title: resource.title,
        href: routes.dashboardV2CreatorResource(resource.id),
        status: toCreatorStatusLabel(resource.status),
        salesLabel: formatMoneyCents(resource.revenue),
        downloadsLabel: `${formatNumber(resource.downloadCount)} downloads`,
      })),
      profile: {
        displayName,
        slugLabel: profile?.creatorSlug
          ? `/creators/${profile.creatorSlug}`
          : "No public slug",
        publicProfileHref: profile?.creatorSlug
          ? routes.creatorPublicProfile(profile.creatorSlug)
          : null,
        bio: profile?.creatorBio?.trim() || "No storefront bio yet.",
        statusLabel: toCreatorStatusLabel(profile?.creatorStatus),
        avatarUrl: profile?.creatorAvatar?.trim() || profile?.image?.trim() || null,
        avatarInitial: toAvatarInitial(displayName),
        hasBio,
        hasSlug,
        hasDisplayName,
      },
    };
  } catch {
    return getErrorWorkspaceData();
  }
}
