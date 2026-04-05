"use client";

import { useEffect } from "react";
import { ResourceDetailShell } from "@/components/resources/detail/ResourceDetailShell";
import { routes } from "@/lib/routes";

export default function ResourceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RESOURCE_DETAIL_ROUTE_ERROR]", error);
  }, [error]);

  return (
    <ResourceDetailShell>
      <div className="mx-auto max-w-2xl rounded-[28px] border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-8 sm:py-12">
        <div className="space-y-3">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary-700">
            Resource error
          </p>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            This resource could not load right now.
          </h1>
          <p className="text-body leading-7 text-muted-foreground">
            Try the page again. If the problem continues, return to the library and reopen the
            resource.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-small font-semibold text-white transition hover:bg-brand-700"
          >
            Try again
          </button>
          <a
            href={routes.marketplace}
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-small font-medium text-foreground transition hover:bg-muted"
          >
            Back to resources
          </a>
        </div>
      </div>
    </ResourceDetailShell>
  );
}
