import { routes } from "@/lib/routes";
import {
  canAccessCreatorWorkspace,
  getCreatorAccessState,
  getCreatorProfile,
} from "@/services/creator";
import { getCreatorSetupState } from "@/services/creator/creator-setup.service";

export type DashboardV2CreatorSettingsData =
  | {
      state: "ready";
      creatorName: string;
      controls: Array<{
        id:
          | "storefront-status"
          | "public-profile"
          | "publishing-readiness"
          | "account-notifications";
        label: string;
        detail: string;
        stateLabel: string;
        stateTone: "success" | "warning" | "neutral";
        href: string;
        actionLabel: string;
      }>;
    }
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

function toCreatorStatusLabel(status: string | null | undefined) {
  if (!status) return "Inactive";

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getDashboardV2CreatorSettingsData(
  userId: string,
): Promise<DashboardV2CreatorSettingsData> {
  try {
    const access = await getCreatorAccessState(userId);

    if (!canAccessCreatorWorkspace(access)) {
      return {
        state: "locked",
        title: "Creator access is not active",
        description:
          "Apply for creator access before managing storefront visibility, publishing readiness, and creator-specific controls.",
        ctaHref: routes.dashboardV2CreatorApply,
        ctaLabel: "Apply for creator access",
      };
    }

    const [profile, setup] = await Promise.all([
      getCreatorProfile(userId),
      getCreatorSetupState(userId),
    ]);

    if (!profile) {
      return {
        state: "error",
        title: "Could not load creator settings",
        description:
          "Refresh this route to retry. Creator controls stay protected behind the dashboard-v2 session gate.",
      };
    }

    const creatorName =
      profile.creatorDisplayName?.trim() ||
      profile.name?.trim() ||
      "Creator workspace";
    const hasPublicProfile = Boolean(profile.creatorSlug?.trim());
    const profileComplete = setup.steps.profileComplete;
    const statusLabel = toCreatorStatusLabel(profile.creatorStatus);
    const publishedDetail =
      setup.publishedResources > 0
        ? `${setup.publishedResources} published · ${setup.draftResources} draft${
            setup.draftResources === 1 ? "" : "s"
          }`
        : setup.totalResources > 0
          ? `${setup.totalResources} total resource${
              setup.totalResources === 1 ? "" : "s"
            } · 0 published`
          : "No resources in inventory yet";

    return {
      state: "ready",
      creatorName,
      controls: [
        {
          id: "storefront-status",
          label: "Storefront status",
          detail:
            profile.creatorStatus === "ACTIVE"
              ? "Your storefront can appear publicly when resources are published."
              : "Paused storefronts keep the profile but signal limited creator activity.",
          stateLabel: statusLabel,
          stateTone:
            profile.creatorStatus === "ACTIVE" ? "success" : "warning",
          href: routes.dashboardV2CreatorProfile,
          actionLabel: "Edit profile",
        },
        {
          id: "public-profile",
          label: "Public profile",
          detail: hasPublicProfile
            ? `/creators/${profile.creatorSlug}`
            : "Add a public slug before sharing a storefront URL.",
          stateLabel: hasPublicProfile ? "Live" : "Needs slug",
          stateTone: hasPublicProfile ? "success" : "warning",
          href: hasPublicProfile
            ? routes.creatorPublicProfile(profile.creatorSlug!)
            : routes.dashboardV2CreatorProfile,
          actionLabel: hasPublicProfile ? "View profile" : "Add slug",
        },
        {
          id: "publishing-readiness",
          label: "Publishing readiness",
          detail: profileComplete
            ? publishedDetail
            : "Finish display name and slug before treating the storefront as ready.",
          stateLabel: setup.steps.firstResourcePublished
            ? "Ready"
            : profileComplete
              ? "In progress"
              : "Needs profile",
          stateTone: setup.steps.firstResourcePublished
            ? "success"
            : profileComplete
              ? "warning"
              : "neutral",
          href: routes.dashboardV2CreatorResources,
          actionLabel: "Open resources",
        },
        {
          id: "account-notifications",
          label: "Account notifications",
          detail:
            "Creator alerts follow the dashboard-v2 account settings route. Billing and receipts stay there too.",
          stateLabel: "Account settings",
          stateTone: "neutral",
          href: routes.dashboardV2Settings,
          actionLabel: "Open settings",
        },
      ],
    };
  } catch {
    return {
      state: "error",
      title: "Could not load creator settings",
      description:
        "Refresh this route to retry. Creator controls stay protected behind the dashboard-v2 session gate.",
    };
  }
}
