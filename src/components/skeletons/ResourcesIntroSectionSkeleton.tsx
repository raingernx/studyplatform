"use client";

interface ResourcesIntroSectionSkeletonProps {
  isDiscoverMode: boolean;
}

export function ResourcesIntroSectionSkeleton({
  isDiscoverMode,
}: ResourcesIntroSectionSkeletonProps) {
  return (
    <section className="rounded-[32px] border border-surface-200 bg-white/90 p-4 shadow-card sm:p-5 lg:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-100" />

            {isDiscoverMode ? (
              <div className="space-y-2">
                <div className="h-8 w-full max-w-[680px] animate-pulse rounded-xl bg-surface-100 sm:h-10" />
                <div className="h-8 w-4/5 max-w-[520px] animate-pulse rounded-xl bg-surface-100 sm:h-10" />
              </div>
            ) : (
              <div className="h-8 w-72 animate-pulse rounded-xl bg-surface-100 sm:h-10" />
            )}

            {isDiscoverMode ? (
              <div className="space-y-2 pt-1">
                <div className="h-4 w-full max-w-[640px] animate-pulse rounded bg-surface-100" />
                <div className="h-4 w-5/6 max-w-[560px] animate-pulse rounded bg-surface-100" />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full border border-surface-200 bg-surface-50" />
            <div className="h-6 w-24 animate-pulse rounded-full border border-surface-200 bg-surface-50" />
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-surface-200 via-surface-100 to-transparent" aria-hidden />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 items-center gap-3 overflow-hidden sm:gap-4">
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-surface-100" />
            <div className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />
            <div className="flex gap-2 overflow-hidden">
              {[52, 70, 78, 62, 88, 64].map((width, index) => (
                <div
                  key={index}
                  className="h-8 shrink-0 animate-pulse rounded-full bg-surface-100"
                  style={{ width }}
                />
              ))}
            </div>
          </div>

          <div className="h-11 w-full shrink-0 animate-pulse rounded-2xl border border-surface-200 bg-white shadow-sm lg:max-w-lg" />
        </div>
      </div>
    </section>
  );
}
