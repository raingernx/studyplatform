"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { routes } from "@/lib/routes";

export default function ResourcesRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RESOURCES_ROUTE_ERROR]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      <main className="flex-1">
        <Container className="py-10 sm:py-12 lg:py-14">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-8 sm:py-12">
            <div className="space-y-3">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary-700">
                Library error
              </p>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                The resource library could not load.
              </h1>
              <p className="text-body leading-7 text-muted-foreground">
                Try again, or return to the main resource index and reopen the library.
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
              <Link
                href={routes.marketplace}
                className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-small font-medium text-foreground transition hover:bg-muted"
              >
                Open resources
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
