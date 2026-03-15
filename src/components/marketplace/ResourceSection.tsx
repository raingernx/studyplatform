import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ResourceCard, type ResourceCardData } from "@/components/resources/ResourceCard";

interface ResourceSectionProps {
  title: string;
  viewAllHref?: string;
  resources: ResourceCardData[];
  ownedIds?: string[];
}

/**
 * Horizontal-scroll card strip used on the marketplace home page.
 * Each card is fixed-width; overflow creates a scrollable row.
 */
export function ResourceSection({
  title,
  viewAllHref,
  resources,
  ownedIds = [],
}: ResourceSectionProps) {
  if (resources.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-h3 font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group flex items-center gap-1 text-[13px] font-medium text-brand-600 transition hover:underline hover:text-brand-700"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Horizontal scroll row */}
      <div className="relative">
        {/* Fade edge — right side */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-surface-50 to-transparent" />

        <div className="flex gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {resources.map((resource) => (
            <div key={resource.id} className="w-[220px] flex-shrink-0">
              <ResourceCard
                resource={resource}
                variant="marketplace"
                owned={ownedIds.includes(resource.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
