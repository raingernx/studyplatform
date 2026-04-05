import { PageContent } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function AdminSectionSkeleton({
  columns = 2,
  rows = 2,
}: {
  columns?: 1 | 2;
  rows?: number;
}) {
  const gridClass = columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="space-y-5 border-b border-border pb-6 last:border-b-0 last:pb-0">
      <div className="space-y-2">
        <LoadingSkeleton className="h-5 w-36 rounded-md" />
        <LoadingSkeleton className="h-4 w-80 rounded-md" />
      </div>
      <div className={`grid gap-4 ${gridClass}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <LoadingSkeleton className="h-4 w-32 rounded-md" />
            <LoadingSkeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminSettingsPageSkeleton() {
  return (
    <PageContent className="max-w-[1180px] space-y-6 lg:space-y-8">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-32 rounded-md" />
        <LoadingSkeleton className="h-4 w-[34rem] max-w-full rounded-md" />
      </div>

      <div className="space-y-0 rounded-2xl border border-border bg-card px-6 py-6 shadow-card sm:px-7 sm:py-7">
        <AdminSectionSkeleton rows={6} />
        <section className="space-y-5 border-b border-border pb-6">
          <div className="space-y-2">
            <LoadingSkeleton className="h-5 w-36 rounded-md" />
            <LoadingSkeleton className="h-4 w-80 rounded-md" />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingSkeleton
                key={index}
                className="h-48 rounded-xl border border-border bg-muted"
              />
            ))}
          </div>
        </section>
        <section className="space-y-5 border-b border-border pb-6">
          <div className="space-y-2">
            <LoadingSkeleton className="h-5 w-32 rounded-md" />
            <LoadingSkeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-44 rounded-md" />
                  <LoadingSkeleton className="h-3.5 w-72 rounded-md" />
                </div>
                <LoadingSkeleton className="h-6 w-[46px] rounded-full" />
              </div>
            ))}
          </div>
        </section>
        <AdminSectionSkeleton rows={2} />
        <AdminSectionSkeleton rows={3} columns={1} />
        <AdminSectionSkeleton rows={3} />
        <AdminSectionSkeleton rows={5} columns={1} />
      </div>

      <div className="flex justify-end">
        <LoadingSkeleton className="h-12 w-56 rounded-2xl border border-border bg-card" />
      </div>
    </PageContent>
  );
}
