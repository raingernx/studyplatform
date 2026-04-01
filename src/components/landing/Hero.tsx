"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/design-system";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";
import { ResourceCard, type ResourceCardResource } from "@/components/resources/ResourceCard";
import { routes } from "@/lib/routes";

/* ── Static fallback (shown only when no real data is passed) ──────────── */

const FALLBACK_RESOURCES: ResourceCardResource[] = [
  {
    id: "hero-1",
    slug: "algebra-review-pack",
    title: "Algebra review pack",
    description: "Quick worksheets and practice questions for midterm prep.",
    authorName: "Top student",
    isFree: false,
    price: 199,
  },
  {
    id: "hero-2",
    slug: "biology-diagram-set",
    title: "Biology diagram set",
    description: "Labelled diagrams for cells, systems, and more.",
    authorName: "Science club",
    isFree: true,
    price: 0,
  },
  {
    id: "hero-3",
    slug: "ielts-speaking-deck",
    title: "IELTS speaking deck",
    description: "Flashcards for common speaking topics and phrases.",
    authorName: "Language tutor",
    isFree: false,
    price: 249,
  },
];

const HERO_CATEGORIES = [
  { label: "Math",       slug: "mathematics" },
  { label: "Science",    slug: "science"     },
  { label: "Languages",  slug: "languages"   },
  { label: "Exam Prep",  slug: "test-prep"   },
  { label: "Worksheets", slug: "worksheets"  },
];

/* ── Rotation + offset for each stacked card ─────────────────────────── */
const CARD_TRANSFORMS = [
  { rotate: "-4deg",  translateX: "-28px", translateY: "8px",  zIndex: 1 },
  { rotate:  "1.5deg",translateX:  "0px",  translateY: "-8px", zIndex: 3 },
  { rotate:  "5deg",  translateX: "28px",  translateY: "8px",  zIndex: 2 },
];

/* ── Component ───────────────────────────────────────────────────────────── */

interface HeroProps {
  heroResources?: ResourceCardResource[];
}

export function Hero({ heroResources }: HeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      const href = routes.marketplaceSearch(q);
      beginResourcesNavigation("listing", href);
      router.push(href);
    }
  }

  const cards = heroResources?.length ? heroResources.slice(0, 3) : FALLBACK_RESOURCES;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-accent-50">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-200 blur-3xl opacity-30" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-accent-200 blur-3xl opacity-30" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 py-24 sm:px-8 lg:flex-row lg:items-center">

        {/* ── Left: copy + discovery ───────────────────────────────────── */}
        <div className="flex-1 space-y-6">

          {/* Eyebrow */}
          <p className="text-micro font-semibold uppercase tracking-[0.18em] text-brand-700">
            Education marketplace
          </p>

          {/* Heading */}
          <h1 className="font-display text-hero font-semibold tracking-tight text-text-primary">
            Study smarter with ready-made learning{" "}
            <span className="text-brand-600">resources</span>
          </h1>

          {/* Sub-copy */}
          <p className="max-w-2xl text-body-lg text-text-secondary">
            Browse worksheets, flashcards, notes, and study guides created by
            students and educators.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search worksheets, flashcards, lesson plans..."
              className="w-full rounded-xl border border-surface-200 bg-white py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted shadow-inner-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </form>

          {/* Category quick filters */}
          <div className="flex flex-wrap gap-2">
            {HERO_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={routes.marketplaceCategory(cat.slug)}
                className="rounded-full border border-surface-200 bg-white px-3 py-1 text-micro font-medium text-text-secondary transition hover:border-surface-300 hover:bg-surface-100"
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Link href={routes.marketplaceCategory("all")}>
              <Button size="lg" className="bg-brand-600 text-white hover:bg-brand-700">
                Browse resources
              </Button>
            </Link>
            <Link href={routes.membership}>
              <Button variant="outline" size="lg" className="border border-surface-200 hover:bg-surface-100">
                Sell your resources
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-micro text-text-muted">
            10,000+ resources&nbsp;&bull;&nbsp;Trusted by students and teachers
          </p>
        </div>

        {/* ── Right: stacked ResourceCard previews ─────────────────────── */}
        <div className="relative hidden flex-1 items-center justify-center lg:flex min-h-[460px]">
          {/* Background glow panel */}
          <div className="absolute inset-0 -z-10 rounded-3xl bg-white/60 shadow-card" />

          {/* Stacked cards — fixed box so shadows don't clip, each card offset */}
          <div className="relative w-[360px] h-[420px]">
            {cards.map((resource, i) => (
              <div
                key={resource.id ?? i}
                className={[
                  "absolute w-[320px] h-[394px]",
                  "pointer-events-auto",
                  i === 0 ? "top-0 left-0 z-30" : "",
                  i === 1 ? "top-6 left-6 z-20" : "",
                  i === 2 ? "top-12 left-12 z-10" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div
                  className="hero-card h-full rounded-xl will-change-transform shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(0,0,0,0.16)]"
                >
                  <ResourceCard resource={resource} variant="hero" size="lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
