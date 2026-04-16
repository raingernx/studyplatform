"use client";

import { NavbarShell } from "@/components/layout/NavbarShell";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  Container,
  PageContainer,
  PageContent,
} from "@/design-system";

function ListingHeaderSearchSkeleton() {
  return (
    <div className="hidden min-w-0 flex-1 lg:flex">
      <LoadingSkeleton className="h-10 w-full max-w-[560px] rounded-xl" />
    </div>
  );
}

function LegalSectionSkeleton() {
  return (
    <section className="space-y-3">
      <LoadingSkeleton className="h-5 w-40" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-[92%]" />
      <LoadingSkeleton className="h-4 w-[80%]" />
    </section>
  );
}

export function LegalDocumentLoadingShell({
  titleWidth = "w-56",
}: {
  titleWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavbarShell />
      <Container className="py-16">
        <div className="mx-auto max-w-2xl">
          <LoadingSkeleton className={`h-10 rounded-2xl ${titleWidth}`} />
          <LoadingSkeleton className="mt-2 h-4 w-32" />

          <div className="mt-10 space-y-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <LegalSectionSkeleton key={index} />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

export function SupportPageLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavbarShell
        hasMarketplaceShell
        headerSearch={<ListingHeaderSearchSkeleton />}
      />

      <main className="flex-1">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-3xl space-y-8">
            <LoadingSkeleton className="h-4 w-40" />

            <section className="rounded-[32px] border border-border bg-card p-8 shadow-card sm:p-10">
              <div className="space-y-4">
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-12 w-80 rounded-2xl" />
                <LoadingSkeleton className="h-4 w-full max-w-2xl" />
                <LoadingSkeleton className="h-4 w-[90%] max-w-2xl" />
              </div>

              <div className="mt-8 rounded-3xl border border-border bg-muted p-6">
                <LoadingSkeleton className="h-3 w-24" />
                <LoadingSkeleton className="mt-3 h-6 w-56 rounded-xl" />
                <div className="mt-4 space-y-2">
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-[88%]" />
                  <LoadingSkeleton className="h-4 w-[76%]" />
                </div>
              </div>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}

export function MembershipPageLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavbarShell
        hasMarketplaceShell
        headerSearch={<ListingHeaderSearchSkeleton />}
      />

      <main className="flex-1">
        <PageContainer className="py-12 sm:py-14 lg:py-16">
          <PageContent className="space-y-10 lg:space-y-12">
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <LoadingSkeleton className="h-10 w-40 rounded-2xl" />
                <LoadingSkeleton className="h-5 w-44" />
              </div>

              <div className="shrink-0">
                <div className="inline-flex gap-2 rounded-full border border-border-subtle bg-card p-0.5">
                  <LoadingSkeleton className="h-8 w-24 rounded-full" />
                  <LoadingSkeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 divide-y divide-border-subtle xl:grid-cols-3 xl:divide-x xl:divide-y-0">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className={`px-0 py-7 sm:py-8 ${
                      index === 0 ? "xl:pr-8" : index === 2 ? "xl:pl-8" : "xl:px-8"
                    }`}
                  >
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <LoadingSkeleton className="h-6 w-20" />
                        <LoadingSkeleton className="h-10 w-24 rounded-2xl" />
                        <LoadingSkeleton className="h-5 w-28" />
                      </div>

                      <div className="space-y-1.5 border-y border-border-subtle py-5">
                        <LoadingSkeleton className="h-5 w-32" />
                        <LoadingSkeleton className="h-4 w-20" />
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((__, rowIndex) => (
                          <div key={rowIndex} className="flex items-center gap-3">
                            <LoadingSkeleton className="h-5 w-5 rounded-full" />
                            <LoadingSkeleton className="h-5 w-40" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <LoadingSkeleton className="mt-8 h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </section>

            <section className="mx-auto w-full max-w-6xl pt-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <LoadingSkeleton className="h-5 w-16" />
                  <LoadingSkeleton className="h-4 w-64" />
                </div>

                <div className="grid gap-x-10 gap-y-0 lg:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, columnIndex) => (
                    <div
                      key={`faq-skeleton-column-${columnIndex}`}
                      className="divide-y divide-border-subtle border-y border-border-subtle"
                    >
                      {Array.from({ length: 4 }).map((__, index) => (
                        <div key={index} className="space-y-3 py-4">
                          <div className="flex items-center justify-between gap-4">
                            <LoadingSkeleton className="h-5 w-60" />
                            <LoadingSkeleton className="h-5 w-5 rounded-full" />
                          </div>
                          <LoadingSkeleton className="h-4 w-full max-w-2xl" />
                          <LoadingSkeleton className="h-4 w-[88%] max-w-xl" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mx-auto w-full max-w-6xl pt-10 pb-14 sm:pt-12 sm:pb-16">
              <div className="rounded-[24px] border border-border-subtle bg-card/40 px-5 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-xl space-y-1.5">
                    <LoadingSkeleton className="h-8 w-80 rounded-2xl" />
                    <LoadingSkeleton className="h-4 w-72" />
                  </div>

                  <div className="w-full lg:w-auto lg:shrink-0">
                    <LoadingSkeleton className="h-11 w-full lg:w-40 rounded-xl" />
                  </div>
                </div>
              </div>
            </section>
          </PageContent>
        </PageContainer>
      </main>
    </div>
  );
}

export function CheckoutStatusPageLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavbarShell />

      <main className="flex flex-1 items-center bg-background">
        <Container className="py-16 sm:py-24">
          <div className="mx-auto max-w-md">
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-card sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <LoadingSkeleton className="h-7 w-7 rounded-full" />
              </div>

              <LoadingSkeleton className="mx-auto mt-5 h-8 w-48 rounded-2xl" />
              <div className="mx-auto mt-3 space-y-2">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-[86%] mx-auto" />
              </div>

              <div className="my-6 border-t border-border" />

              <div className="flex flex-col gap-3">
                <LoadingSkeleton className="h-12 w-full rounded-xl" />
                <LoadingSkeleton className="h-11 w-full rounded-xl" />
              </div>

              <LoadingSkeleton className="mx-auto mt-5 h-4 w-56" />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
