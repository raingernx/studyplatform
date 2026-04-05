import { ResourceCardSkeleton } from "@/components/resources/ResourceCardSkeleton";
import { LoadingSkeleton } from "@/design-system";
import { ResourcesIntroSectionSkeleton } from "@/components/skeletons/ResourcesIntroSectionSkeleton";
import { ResourcesDiscoverSectionsSkeleton } from "@/components/skeletons/ResourcesDiscoverSectionsSkeleton";

export function FilterBarFallback() {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <LoadingSkeleton className="h-5 w-24 rounded-md" />
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
        <LoadingSkeleton className="h-11 w-full rounded-full border border-border bg-card sm:w-28" />
        <LoadingSkeleton className="h-11 w-full rounded-full border border-border bg-muted sm:w-36" />
        <LoadingSkeleton className="h-11 w-16 rounded-full sm:w-20" />
      </div>
    </div>
  );
}

function SidebarFallbackGroup({
  titleWidth,
  rowWidths,
  pillWidths,
}: {
  titleWidth: string;
  rowWidths?: string[];
  pillWidths?: string[];
}) {
  return (
    <div className="border-b border-border pb-4">
      <div className="mb-3 flex items-center justify-between">
        <LoadingSkeleton className={`h-4 rounded ${titleWidth}`} />
        <LoadingSkeleton className="h-4 w-4 rounded" />
      </div>

      {rowWidths ? (
        <div className="space-y-0.5">
          {rowWidths.map((width, index) => (
            <LoadingSkeleton
              key={`${titleWidth}-row-${index}`}
              className={`h-10 rounded-xl ${width}`}
            />
          ))}
        </div>
      ) : null}

      {pillWidths ? (
        <div className="flex flex-wrap gap-2">
          {pillWidths.map((width, index) => (
            <LoadingSkeleton
              key={`${titleWidth}-pill-${index}`}
              className={`h-8 rounded-full border border-border bg-card ${width}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarFallback() {
  return (
    <div className="w-[260px] flex-shrink-0 space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <LoadingSkeleton className="h-4 w-12 rounded" />
        <LoadingSkeleton className="h-4 w-14 rounded" />
      </div>
      <SidebarFallbackGroup
        titleWidth="w-12"
        rowWidths={["w-full", "w-5/6", "w-3/4", "w-[92%]", "w-[88%]", "w-[80%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-16"
        rowWidths={["w-full", "w-[90%]", "w-[84%]", "w-[72%]", "w-[76%]", "w-[68%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-12"
        rowWidths={["w-full", "w-4/5", "w-[70%]"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-20"
        pillWidths={["w-24", "w-28", "w-24"]}
      />
      <SidebarFallbackGroup
        titleWidth="w-24"
        pillWidths={["w-20", "w-28", "w-24"]}
      />
    </div>
  );
}

export function ResourcesContentFallback({
  isDiscoverMode,
}: {
  isDiscoverMode: boolean;
}) {
  return (
    <>
      {!isDiscoverMode ? <ResourcesIntroSectionSkeleton isDiscoverMode={false} /> : null}

      {isDiscoverMode ? (
        <ResourcesDiscoverSectionsSkeleton />
      ) : (
        <section className="space-y-6">
          <div className="space-y-5 pb-7 sm:pb-8">
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="h-8 w-56 rounded-lg" />
            <LoadingSkeleton className="h-4 w-72" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            <div className="hidden lg:block">
              <SidebarFallback />
            </div>

            <div className="min-w-0 flex-1 space-y-5">
              <FilterBarFallback />
              <div className="grid gap-6 lg:gap-8 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ResourceCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
