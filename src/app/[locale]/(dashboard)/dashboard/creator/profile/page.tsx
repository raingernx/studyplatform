import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { CreatorProfileForm } from "@/components/creator/CreatorProfileForm";
import { routes } from "@/lib/routes";
import { getCreatorAccessState, getCreatorProfile } from "@/services/creator.service";

export const metadata = {
  title: "Creator Profile – PaperDock",
};

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator/profile");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const profile = await getCreatorProfile(session.user.id);
  if (!profile) {
    redirect(routes.dashboard);
  }

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
              Creator
            </p>
            <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-neutral-900">
              Creator Profile
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Build the public identity learners see across your creator page and resource listings.
            </p>
          </div>

          <div className="ml-auto flex shrink-0 flex-col items-end justify-end gap-2 self-end text-right">
            {profile.creatorSlug ? (
              <Link
                href={routes.creatorPublicProfile(profile.creatorSlug)}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                View public profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 self-end text-sm font-medium text-muted-foreground/60">
                  View public profile
                  <ArrowRight className="h-4 w-4" />
                </span>
                <p className="max-w-xs text-xs text-neutral-500">
                  Save a creator slug to unlock your public profile page.
                </p>
              </>
            )}
          </div>
        </div>

        <CreatorProfileForm profile={profile} />
      </div>
    </div>
  );
}
