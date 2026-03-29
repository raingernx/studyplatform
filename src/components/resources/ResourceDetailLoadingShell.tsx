import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { PurchaseCardSkeleton } from "@/components/resource/PurchaseCardSkeleton";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export function ResourceDetailLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar headerSearch={<HeroSearch variant="listing" />} />

      <main className="flex-1 bg-zinc-50">
        <Container className="py-8 sm:py-10 lg:py-12">
          <div className="space-y-6 lg:space-y-9">
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-40" />
              <LoadingSkeleton className="h-10 w-3/4 max-w-2xl rounded-2xl" />
              <LoadingSkeleton className="h-4 w-64" />
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
              <div className="order-1 lg:col-start-1 lg:row-start-1">
                <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[80px_minmax(0,1fr)]">
                  <LoadingSkeleton className="order-1 aspect-[4/3] min-h-[420px] w-full rounded-xl border border-surface-200 bg-white/80 shadow-sm lg:order-2" />
                  <div className="order-2 flex w-full gap-2 overflow-hidden pb-1 lg:h-full lg:min-h-0 lg:order-1 lg:w-20 lg:flex-col lg:gap-3 lg:overflow-y-auto">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <LoadingSkeleton
                        key={index}
                        className="aspect-square w-16 shrink-0 rounded-lg border border-surface-200 bg-white/80 lg:w-20"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-3 space-y-6 lg:col-start-1 lg:row-start-2">
                <LoadingSkeleton className="h-14 rounded-2xl border border-surface-200 bg-white/80" />
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <LoadingSkeleton className="h-56 rounded-[28px] border border-surface-200 bg-white/80" />
                  <LoadingSkeleton className="h-56 rounded-[28px] border border-surface-200 bg-white/80" />
                </div>
                <LoadingSkeleton className="h-72 rounded-[28px] border border-surface-200 bg-white/80" />
              </div>

              <aside className="order-2 self-start lg:col-start-2 lg:row-start-1 lg:row-span-2">
                <PurchaseCardSkeleton />
              </aside>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
