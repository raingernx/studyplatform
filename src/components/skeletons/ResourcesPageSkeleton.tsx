"use client";

import { type HomepageHeroConfig, HeroBannerSkeleton } from "@/components/marketplace/HeroBanner";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { ResourcesIntroSectionSkeleton } from "@/components/skeletons/ResourcesIntroSectionSkeleton";

/**
 * Full-page skeleton for the /resources marketplace page.
 *
 * Mirrors the discover-mode layout (no category selected) — the default
 * entry state for the homepage. Includes the real Navbar because each
 * public page renders its own Navbar inside the page component, not in
 * the shared root layout.
 *
 * Dimensions, grid classes, and max-widths match the real page exactly
 * to avoid layout shift when the real content replaces this skeleton.
 */
export function ResourcesPageSkeleton({
  heroConfig,
}: {
  heroConfig?: HomepageHeroConfig;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        {/* ── Announcement bar + Hero banner ───────────────────────────── */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="mx-auto max-w-[1600px] space-y-4">
            {/* Announcement bar */}
            <div className="h-10 animate-pulse rounded-2xl border border-surface-200 bg-white" />
            {/* Hero banner */}
            <HeroBannerSkeleton config={heroConfig} />
          </div>
        </section>

        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">
          <ResourcesIntroSectionSkeleton isDiscoverMode />

          {/* ── Browse by category ─────────────────────────────────────── */}
          <section className="space-y-6">
            <div className="space-y-1.5">
              <div className="h-6 w-40 animate-pulse rounded bg-surface-100" />
              <div className="h-4 w-80 animate-pulse rounded bg-surface-100" />
            </div>
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-[24px] border border-surface-200 bg-white shadow-card"
                />
              ))}
            </div>
          </section>

          {/* ── Trending now ───────────────────────────────────────────── */}
          <SectionSkeleton titleWidth="w-32" cardCount={4} />

          {/* ── Recommended / secondary section ────────────────────────── */}
          <SectionSkeleton titleWidth="w-48" cardCount={4} />
        </Container>
      </main>
    </div>
  );
}

/** Reusable section skeleton: header + card grid. */
function SectionSkeleton({
  titleWidth,
  cardCount,
}: {
  titleWidth: string;
  cardCount: number;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-surface-200/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className={`h-6 animate-pulse rounded bg-surface-100 ${titleWidth}`} />
          <div className="h-4 w-64 animate-pulse rounded bg-surface-100" />
        </div>
        <div className="h-6 w-16 animate-pulse rounded bg-surface-100" />
      </div>
      <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: cardCount }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
