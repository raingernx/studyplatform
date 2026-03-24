"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { ResourcesIntroSectionSkeleton } from "@/components/skeletons/ResourcesIntroSectionSkeleton";

/**
 * Neutral route-level skeleton for /resources — used by the loading.tsx that
 * fires on ALL client-side navigations to this route, regardless of mode.
 *
 * The problem: loading.tsx receives no search params, so it cannot know
 * whether the page will render in discover mode (no category/search) or
 * browse mode (?category=X / ?search=X). Rendering either mode's full
 * skeleton causes a layout shift when the other mode loads.
 *
 * The solution: render only the section that is structurally identical in
 * both modes — the category nav + search card — then show a flat card grid
 * below. Both modes ultimately render resource cards; the transition from a
 * flat grid to either discover sections or a sidebar grid is minimal.
 *
 * What is deliberately excluded:
 * - Hero banner + announcement bar (discover-only)
 * - Sidebar filter panel (browse-only)
 * - FilterBar toolbar (browse-only)
 * - Named section headers / "Browse by category" grid (discover-only)
 *
 * ResourcesPageSkeleton  — kept for discover-mode storybook / preview use
 * BrowseResultsPageSkeleton — kept for browse-mode storybook / preview use
 */
export function ResourcesRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">
          <ResourcesIntroSectionSkeleton isDiscoverMode={false} />

          {/* ── Neutral card grid — valid placeholder for both modes ──── */}
          <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {Array.from({ length: 8 }).map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>

        </Container>
      </main>
    </div>
  );
}
