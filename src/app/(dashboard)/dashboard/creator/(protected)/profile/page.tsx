import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CreatorProfileForm } from "@/components/creator/CreatorProfileForm";
import { routes } from "@/lib/routes";
import { getCreatorProfile } from "@/services/creator";
import { getCreatorProtectedUserContext } from "../creatorProtectedUser";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";

export const metadata = {
  title: "Creator Profile",
};

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorProfile);
  const profile = await getCreatorProfile(userId);

  if (!profile) {
    redirect(routes.dashboard);
  }

  return (
    <DashboardPageShell routeReady="dashboard-creator-profile">
      <DashboardPageHeader
        eyebrow="Creator"
        title="Creator Profile"
        description="Build the public identity learners see across your creator page and resource listings."
        actions={<CreatorProfileLink profile={profile} />}
      />
      <CreatorProfileContent profile={profile} />
    </DashboardPageShell>
  );
}

function CreatorProfileLink({
  profile,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getCreatorProfile>>>;
}) {
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

function CreatorProfileContent({
  profile,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getCreatorProfile>>>;
}) {
  return (
    <DashboardPageStack>
      <CreatorProfileForm profile={profile} />
    </DashboardPageStack>
  );
}
