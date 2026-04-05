import { LoadingSkeleton } from "@/design-system";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1 space-y-2">
          <LoadingSkeleton className="h-3 w-16" />
          <LoadingSkeleton className="h-10 w-52 rounded-2xl" />
          <LoadingSkeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="ml-auto h-4 w-36" />
          <LoadingSkeleton className="ml-auto h-3 w-48" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-4">
          <LoadingSkeleton className="h-5 w-28" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <LoadingSkeleton className="h-12 w-full rounded-xl" />
            <LoadingSkeleton className="h-12 w-full rounded-xl" />
          </div>
          <LoadingSkeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
