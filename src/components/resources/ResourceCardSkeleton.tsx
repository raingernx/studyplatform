import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export function ResourceCardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
      {/* Image placeholder — 4:3 ratio, matches card */}
      <LoadingSkeleton className="aspect-[4/3] w-full rounded-t-xl rounded-b-none" />

      {/* Body: title + author + price */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-3 w-1/3" />
        <LoadingSkeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
