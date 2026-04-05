import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { LoadingSkeleton } from "@/design-system";

function DiscoverDeferredSectionFallback({
  titleWidth,
  cardCount,
}: {
  titleWidth: string;
  cardCount: number;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <LoadingSkeleton className={`h-6 ${titleWidth}`} />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton className="h-6 w-16" />
      </div>
      <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {Array.from({ length: cardCount }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function DiscoverBrowseTilesFallback() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-6 w-56" />
          <LoadingSkeleton className="h-4 w-80" />
        </div>
        <LoadingSkeleton className="h-6 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-48 rounded-[24px]" />
        ))}
      </div>
    </section>
  );
}

function DiscoverCollectionsFallback() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-6 w-52" />
          <LoadingSkeleton className="h-4 w-72" />
        </div>
        <LoadingSkeleton className="h-6 w-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-72 rounded-[24px]" />
        ))}
      </div>
    </section>
  );
}

export function ResourcesDiscoverSectionsSkeleton() {
  return (
    <div className="space-y-16 lg:space-y-20">
      <DiscoverBrowseTilesFallback />
      <DiscoverDeferredSectionFallback titleWidth="w-52" cardCount={4} />
      <DiscoverDeferredSectionFallback titleWidth="w-40" cardCount={4} />
      <DiscoverCollectionsFallback />
    </div>
  );
}
