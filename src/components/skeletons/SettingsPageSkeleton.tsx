import { PageContentNarrow } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

function FlatSectionSkeleton({
  rows,
  footerWidth,
}: {
  rows: number;
  footerWidth?: string;
}) {
  return (
    <section className="space-y-5 border-b border-border pb-6 last:border-b-0 last:pb-0">
      <div className="space-y-2">
        <LoadingSkeleton className="h-5 w-28 rounded-md" />
        <LoadingSkeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_240px] md:gap-6"
          >
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-32 rounded-md" />
              <LoadingSkeleton className="h-3.5 w-64 rounded-md" />
            </div>
            <LoadingSkeleton className="h-11 w-full max-w-xs rounded-xl" />
          </div>
        ))}
      </div>
      {footerWidth ? <LoadingSkeleton className={`h-9 rounded-xl ${footerWidth}`} /> : null}
    </section>
  );
}

export function SettingsPageSkeleton() {
  return (
    <PageContentNarrow className="space-y-8">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-32 rounded-md" />
        <LoadingSkeleton className="h-4 w-72 rounded-md" />
      </div>

      <div className="space-y-0">
        <FlatSectionSkeleton rows={2} footerWidth="w-32" />
        <FlatSectionSkeleton rows={1} footerWidth="w-36" />
        <FlatSectionSkeleton rows={4} />
        <FlatSectionSkeleton rows={3} footerWidth="w-32" />
        <div className="pt-6">
          <LoadingSkeleton className="h-24 rounded-xl border border-border bg-card" />
        </div>
      </div>
    </PageContentNarrow>
  );
}
