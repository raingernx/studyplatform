import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/design-system";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { routes } from "@/lib/routes";

export default function ResourcesNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      <main className="flex-1">
        <Container className="py-10 sm:py-12 lg:py-14">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-8 sm:py-12">
            <div className="space-y-3">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-primary-700">
                Library unavailable
              </p>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                The resource library is not available on this route.
              </h1>
              <p className="text-body leading-7 text-muted-foreground">
                Return to the main resources page to continue browsing the marketplace.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <Link
                href={routes.marketplace}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-small font-semibold text-white transition hover:bg-brand-700"
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
