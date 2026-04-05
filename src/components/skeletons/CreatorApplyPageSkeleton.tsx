import { Sparkles } from "lucide-react";
import { PageContent } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export function CreatorApplyPageSkeleton() {
  return (
    <PageContent className="space-y-8">
      <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-8 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <LoadingSkeleton className="h-3.5 w-20 rounded-full bg-blue-200/80" />
            <LoadingSkeleton className="h-9 w-56 rounded-2xl bg-[hsl(var(--card)/0.85)]" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <LoadingSkeleton className="h-4 w-full max-w-3xl bg-[hsl(var(--card)/0.8)]" />
          <LoadingSkeleton className="h-4 w-4/5 max-w-2xl bg-[hsl(var(--card)/0.7)]" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <LoadingSkeleton className="h-10 w-10 rounded-xl" />
              <LoadingSkeleton className="mt-4 h-4 w-40" />
              <div className="mt-2 space-y-2">
                <LoadingSkeleton className="h-3.5 w-full" />
                <LoadingSkeleton className="h-3.5 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <LoadingSkeleton className="h-6 w-48" />
        <div className="mt-3 space-y-2">
          <LoadingSkeleton className="h-4 w-full max-w-2xl" />
          <LoadingSkeleton className="h-4 w-4/5 max-w-xl" />
        </div>
        <div className="mt-6 space-y-4">
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
          <LoadingSkeleton className="h-32 w-full rounded-2xl" />
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </PageContent>
  );
}
