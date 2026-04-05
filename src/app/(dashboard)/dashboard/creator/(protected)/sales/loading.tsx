import { LoadingSkeleton } from "@/design-system";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-10 w-40 rounded-2xl" />
        <LoadingSkeleton className="h-4 w-full max-w-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LoadingSkeleton className="h-10 w-10 rounded-xl" />
            <LoadingSkeleton className="mt-4 h-8 w-24" />
            <LoadingSkeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border/70 px-6 py-4">
          <LoadingSkeleton className="h-5 w-28" />
        </div>
        <div className="space-y-4 px-6 py-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[2fr_1.2fr_1fr_1fr] gap-4">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
