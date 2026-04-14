"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@/design-system";
import { routes } from "@/lib/routes";

export default function DashboardV2CreatorResourcesRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD_V2_CREATOR_RESOURCES_ROUTE_ERROR]", error);
  }, [error]);

  return (
    <>
      <section className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Creator resources
          </p>
          <h1 className="mt-3 text-balance font-ui text-3xl font-semibold text-foreground">
            Resources could not load
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            This creator resources route hit an unexpected runtime error.
          </p>
        </div>
      </section>

      <EmptyState
        icon={<AlertTriangle className="size-5 text-muted-foreground" aria-hidden />}
        title="Creator resources are temporarily unavailable"
        description="Try this route again, or return to the creator resource inventory and reopen it once the route recovers."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" size="sm" onClick={reset}>
              Try again
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={routes.dashboardV2CreatorResources}>
                Back to resources
              </Link>
            </Button>
          </div>
        }
        className="border-border-subtle py-20"
      />
    </>
  );
}
