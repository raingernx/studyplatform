import { LoadingSkeleton } from "@/design-system";

interface ResourcesIntroSectionSkeletonProps {
  isDiscoverMode: boolean;
}

export function ResourcesIntroSectionSkeleton({
  isDiscoverMode,
}: ResourcesIntroSectionSkeletonProps) {
  return (
    <section className="border-b border-border pb-7 sm:pb-8">
      {isDiscoverMode ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-28" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <LoadingSkeleton className="h-3 w-16" />
              <LoadingSkeleton className="h-8 w-72 rounded-xl sm:h-10" />
              <LoadingSkeleton className="h-4 w-72" />
            </div>
            <div className="flex flex-wrap gap-2">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
