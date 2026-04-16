"use client";

import { NavbarShell } from "@/components/layout/NavbarShell";
import { ResourcesCatalogSearchSkeleton } from "@/components/marketplace/ResourcesCatalogControlsSkeleton";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Container, PageContainer, PageContentWide } from "@/design-system";

export function CategoryPageLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavbarShell
        hasMarketplaceShell
        headerSearch={<ResourcesCatalogSearchSkeleton />}
      />

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
        <Container className="space-y-6 pb-12 pt-10 lg:pb-14 lg:pt-12">
          <LoadingSkeleton className="h-4 w-28 bg-white/20" />
          <div className="flex items-center gap-4 sm:gap-5">
            <LoadingSkeleton className="h-14 w-14 rounded-full bg-white/20" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-10 w-56 rounded-2xl bg-white/20" />
              <LoadingSkeleton className="h-4 w-[30rem] max-w-[70vw] bg-white/15" />
            </div>
          </div>
          <LoadingSkeleton className="h-8 w-32 rounded-full bg-white/20" />
        </Container>
      </div>

      <main className="flex-1">
        <Container className="py-12 sm:py-14 lg:py-16">
          <div className="rounded-[32px] border border-border bg-[hsl(var(--card)/0.85)] p-4 shadow-card sm:p-5 lg:p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <LoadingSkeleton className="h-3 w-28" />
                <LoadingSkeleton className="h-8 w-64 rounded-2xl" />
                <LoadingSkeleton className="h-4 w-[32rem] max-w-[75vw]" />
              </div>
              <LoadingSkeleton className="h-4 w-24" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-xl border border-border-subtle bg-card">
                  <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <LoadingSkeleton className="h-4 w-4/5" />
                    <LoadingSkeleton className="h-4 w-2/3" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                    <LoadingSkeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

export function CategoryPageResourceCountFallback() {
  return <LoadingSkeleton className="h-8 w-32 rounded-full bg-white/20" />;
}

export function CategoryPageResourcesSectionFallback() {
  return (
    <div className="rounded-[32px] border border-border bg-[hsl(var(--card)/0.85)] p-4 shadow-card sm:p-5 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <LoadingSkeleton className="h-3 w-28" />
          <LoadingSkeleton className="h-8 w-56 rounded-2xl" />
          <LoadingSkeleton className="h-4 w-[32rem] max-w-[75vw]" />
        </div>
        <LoadingSkeleton className="h-4 w-24" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border-subtle bg-card"
          >
            <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <LoadingSkeleton className="h-4 w-4/5" />
              <LoadingSkeleton className="h-4 w-2/3" />
              <LoadingSkeleton className="h-3 w-1/2" />
              <LoadingSkeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreatorPublicProfileLoadingShell() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarShell
        hasMarketplaceShell
        headerSearch={<ResourcesCatalogSearchSkeleton />}
      />

      <main>
        <PageContainer className="py-10">
          <PageContentWide>
            <div className="space-y-10">
              <section className="overflow-hidden rounded-[32px] border border-border bg-card shadow-card">
                <LoadingSkeleton className="h-72 w-full rounded-none" />

                <div className="-mt-64 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <LoadingSkeleton className="h-7 w-28 rounded-full bg-card/80" />
                      <LoadingSkeleton className="h-7 w-32 rounded-full bg-card/80" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <LoadingSkeleton
                          key={index}
                          className="size-10 rounded-full bg-card/80"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:gap-6">
                    <LoadingSkeleton className="h-[104px] w-[104px] rounded-[30px] border border-border bg-card/90" />

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <LoadingSkeleton className="h-12 w-72 max-w-full rounded-2xl bg-card/85" />
                        <LoadingSkeleton className="h-5 w-full max-w-3xl bg-card/70" />
                        <LoadingSkeleton className="h-5 w-4/5 max-w-2xl bg-card/60" />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <LoadingSkeleton className="h-4 w-40 bg-card/65" />
                        <LoadingSkeleton className="h-4 w-32 bg-card/55" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <CreatorPublicResourcesSectionFallback />
            </div>
          </PageContentWide>
        </PageContainer>
      </main>
    </div>
  );
}

export function CreatorPublicResourcesSectionFallback() {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-56 rounded-2xl" />
        <LoadingSkeleton className="h-4 w-[32rem] max-w-[72vw]" />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border-subtle bg-card">
            <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <LoadingSkeleton className="h-4 w-4/5" />
              <LoadingSkeleton className="h-4 w-2/3" />
              <LoadingSkeleton className="h-3 w-1/2" />
              <LoadingSkeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminCreatorsPageSkeleton() {
  return (
    <div className="min-w-0 space-y-8">
      <div className="border-b border-border pb-4">
        <LoadingSkeleton className="h-3 w-12" />
        <LoadingSkeleton className="mt-2 h-10 w-64 rounded-2xl" />
        <LoadingSkeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-[1.2fr_1.2fr_1.6fr_0.8fr_0.7fr_0.8fr] gap-4 border-b border-border bg-muted px-4 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-3 w-20" />
          ))}
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[1.2fr_1.2fr_1.6fr_0.8fr_0.7fr_0.8fr] items-center gap-4 px-4 py-4"
            >
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-28" />
                <LoadingSkeleton className="h-3 w-36" />
              </div>
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-24" />
                <LoadingSkeleton className="h-3 w-20" />
              </div>
              <div className="space-y-2">
                <LoadingSkeleton className="h-3 w-full" />
                <LoadingSkeleton className="h-3 w-4/5" />
              </div>
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-6 w-20 rounded-full" />
              <LoadingSkeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
