"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/design-system";
import { routes } from "@/lib/routes";

export default function AdminResourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ADMIN_RESOURCES_ROUTE_ERROR]", error);
  }, [error]);

  return (
    <Card className="rounded-2xl px-6 py-8 shadow-sm">
      <div className="space-y-3 text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary-700">
          Resources error
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          The resources workspace could not load.
        </h1>
        <p className="text-body leading-7 text-muted-foreground">
          Try again, or return to the admin dashboard and reopen the resources list.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.adminResources}>Back to resources</Link>
        </Button>
      </div>
    </Card>
  );
}
