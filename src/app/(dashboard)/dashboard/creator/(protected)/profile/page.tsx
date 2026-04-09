import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CreatorProfileForm } from "@/components/creator/CreatorProfileForm";
import { PageContent } from "@/design-system";
import { routes } from "@/lib/routes";
import { getCreatorProfile } from "@/services/creator";
import {
  CreatorDashboardProfileFormSkeleton,
  CreatorDashboardProfileLinkFallback,
} from "@/components/skeletons/CreatorDashboardRouteSkeletons";
import { getCreatorProtectedUserContext } from "../creatorProtectedUser";

export const metadata = {
  title: "Creator Profile",
};

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorProfile);
  const profilePromise = getCreatorProfile(userId);

  return (
    <PageContent data-route-shell-ready="dashboard-creator-profile" className="space-y-8">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
            Creator
          </p>
          <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-foreground">
            Creator Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build the public identity learners see across your creator page and resource listings.
          </p>
        </div>

        <Suspense fallback={<CreatorDashboardProfileLinkFallback />}>
          <CreatorProfileLink profilePromise={profilePromise} />
        </Suspense>
      </div>

      <Suspense fallback={<CreatorDashboardProfileFormSkeleton />}>
        <CreatorProfileContent profilePromise={profilePromise} />
      </Suspense>
    </PageContent>
  );
}

async function CreatorProfileLink({
  profilePromise,
}: {
  profilePromise: ReturnType<typeof getCreatorProfile>;
}) {
  const profile = await profilePromise;
  if (!profile) {
    redirect(routes.dashboard);
  }

  if (profile.creatorSlug) {
    return (
      <div className="ml-auto flex shrink-0 flex-col items-end justify-end gap-2 self-end text-right">
        <Link
          href={routes.creatorPublicProfile(profile.creatorSlug)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          View public profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex shrink-0 flex-col items-end justify-end gap-2 self-end text-right">
      <span className="inline-flex items-center gap-2 self-end text-sm font-medium text-muted-foreground/60">
        View public profile
        <ArrowRight className="h-4 w-4" />
      </span>
      <p className="max-w-xs text-xs text-muted-foreground">
        Save a creator slug to unlock your public profile page.
      </p>
    </div>
  );
}

async function CreatorProfileContent({
  profilePromise,
}: {
  profilePromise: ReturnType<typeof getCreatorProfile>;
}) {
  const profile = await profilePromise;
  if (!profile) {
    redirect(routes.dashboard);
  }

  return <CreatorProfileForm profile={profile} />;
}
