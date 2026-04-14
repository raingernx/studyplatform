import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/design-system";
import { routes } from "@/lib/routes";

interface CreatorWelcomeCardProps {
  creatorName: string | null | undefined;
  canCreate: boolean;
}

export function CreatorWelcomeCard({ creatorName, canCreate }: CreatorWelcomeCardProps) {
  const firstName = creatorName?.split(" ")[0] ?? "there";

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Welcome, Creator
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
            Hey {firstName} — let's get you set up
          </h2>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Your creator account is approved. Complete your profile and publish your first resource to
        start appearing in the marketplace.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={routes.dashboardV2CreatorProfile}>Complete your profile</Link>
        </Button>
        {canCreate && (
          <Button asChild>
            <Link href={routes.dashboardV2CreatorNewResource}>Create your first resource</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
