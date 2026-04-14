import { routes } from "@/lib/routes";
import {
  canAccessCreatorWorkspace,
  getCreatorAccessState,
  getCreatorProfile,
  type CreatorProfile,
} from "@/services/creator";

export type DashboardV2CreatorProfileData =
  | {
      state: "ready";
      profile: CreatorProfile;
      displayName: string;
      statusLabel: string;
      publicProfileHref: string | null;
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

export async function getDashboardV2CreatorProfileData(
  userId: string,
): Promise<DashboardV2CreatorProfileData> {
  try {
    const access = await getCreatorAccessState(userId);

    if (!canAccessCreatorWorkspace(access)) {
      return {
        state: "locked",
        title: "Creator access is not active",
        description:
          "Apply for creator access before editing your storefront identity and public profile.",
        ctaHref: routes.dashboardV2CreatorApply,
        ctaLabel: "Apply for creator access",
      };
    }

    const profile = await getCreatorProfile(userId);

    if (!profile) {
      return {
        state: "error",
        title: "Could not load creator profile",
        description:
          "Refresh this route to retry. Your profile fields stay protected behind the dashboard-v2 session gate.",
      };
    }

    const displayName =
      profile.creatorDisplayName?.trim() ||
      profile.name?.trim() ||
      "Creator profile";

    return {
      state: "ready",
      profile,
      displayName,
      statusLabel: toCreatorStatusLabel(profile.creatorStatus),
      publicProfileHref: profile.creatorSlug
        ? routes.creatorPublicProfile(profile.creatorSlug)
        : null,
    };
  } catch {
    return {
      state: "error",
      title: "Could not load creator profile",
      description:
        "Refresh this route to retry. Your profile fields stay protected behind the dashboard-v2 session gate.",
    };
  }
}
