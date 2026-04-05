import { Container, LoadingSkeleton } from "@/design-system";
import { ScrollableCategoryNav } from "@/components/marketplace/ScrollableCategoryNav";

const CONTROLS_BAR_CLASS_NAME = "border-y border-border bg-card";
const CONTROLS_BAR_MAIN_CLASS_NAME = "flex min-w-0 items-center gap-2.5 overflow-hidden";
const CONTROLS_BAR_GROUP_CLASS_NAME =
  "flex min-w-0 items-center gap-2.5 overflow-hidden";

export function ResourcesCatalogControlsSkeleton({
  showDiscoverMeta: _showDiscoverMeta = false,
}: {
  showDiscoverMeta?: boolean;
}) {
  return (
    <div className={CONTROLS_BAR_CLASS_NAME}>
      <Container className="py-2 sm:py-2.5">
        <div className={CONTROLS_BAR_MAIN_CLASS_NAME}>
          <div className={CONTROLS_BAR_GROUP_CLASS_NAME}>
            <DiscoverFallback />
            <ScrollableCategoryNav>
              <ChipsFallback />
            </ScrollableCategoryNav>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function ResourcesCatalogSearchSkeleton() {
  return <SearchFallback />;
}

export function DiscoverFallback() {
  return (
    <div className="inline-flex h-10 items-center rounded-full border border-border-strong bg-muted px-4 text-base font-medium text-muted-foreground shadow-sm">
      <span>กำลังโหลด</span>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="flex h-10 w-full items-center gap-3 rounded-xl border border-border-strong bg-card px-4 text-base text-muted-foreground shadow-sm sm:rounded-2xl">
      <LoadingSkeleton className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
      <span>กำลังค้นหา...</span>
    </div>
  );
}

export function ChipsFallback() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {["ทั้งหมด", "คณิตศาสตร์", "วิทยาศาสตร์", "ภาษา", "มนุษยศาสตร์", "ปฐมวัย"].map((label, index) => (
        <div
          key={label}
          className={`inline-flex h-10 shrink-0 items-center rounded-full border border-border-strong bg-muted px-4 text-base text-muted-foreground ${
            index === 0 ? "gap-2 pr-4" : ""
          }`}
        >
          {index === 0 ? (
            <LoadingSkeleton className="h-4 w-16" />
          ) : null}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
