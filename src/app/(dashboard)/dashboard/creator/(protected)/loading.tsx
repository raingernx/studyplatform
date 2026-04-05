import { LoadingSkeleton } from "@/design-system";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-10 w-64 rounded-2xl" />
        <LoadingSkeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="mt-4 h-9 w-28" />
            <LoadingSkeleton className="mt-2 h-4 w-full max-w-[220px]" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <LoadingSkeleton className="h-5 w-40" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-border/70 px-4 py-4">
              <LoadingSkeleton className="h-9 w-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-40" />
                <LoadingSkeleton className="h-3 w-28" />
              </div>
              <LoadingSkeleton className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
