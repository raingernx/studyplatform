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
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export const metadata = {
  title: "Creator Profile",
};

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorProfile);
  const profilePromise = getCreatorProfile(userId);

  return (
    <PageContent data-route-shell-ready="dashboard-creator-profile" className="space-y-8">
      <DashboardPageHeader
        eyebrow="Creator"
        title="Creator Profile"
        description="Build the public identity learners see across your creator page and resource listings."
        actions={
          <Suspense fallback={<CreatorDashboardProfileLinkFallback />}>
            <CreatorProfileLink profilePromise={profilePromise} />
          </Suspense>
        }
      />

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
