import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { NavbarBrand } from "@/components/layout/NavbarBrand";
import { Container } from "@/design-system";

function AppRootLoadingShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <Container className="py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex h-11 items-center">
              <NavbarBrand />
            </div>
            <div className="flex items-center gap-2.5">
              <LoadingSkeleton className="hidden h-10 w-32 rounded-full md:block" />
              <LoadingSkeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="space-y-8 py-6 sm:py-8 lg:py-10">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="space-y-3">
                <LoadingSkeleton className="h-4 w-24" />
                <LoadingSkeleton className="h-11 w-4/5 max-w-[32rem]" />
                <LoadingSkeleton className="h-4 w-full max-w-[36rem]" />
                <LoadingSkeleton className="h-4 w-3/4 max-w-[28rem]" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="mt-4 h-8 w-40" />
              <LoadingSkeleton className="mt-2 h-4 w-full" />
              <LoadingSkeleton className="mt-5 h-10 w-36 rounded-xl" />
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <LoadingSkeleton className="h-8 w-8 rounded-xl" />
                <LoadingSkeleton className="mt-4 h-7 w-20" />
                <LoadingSkeleton className="mt-2 h-4 w-28" />
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border px-6 py-4">
              <LoadingSkeleton className="h-5 w-40" />
              <LoadingSkeleton className="mt-2 h-4 w-[22rem] max-w-full" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-6 py-4">
                  <LoadingSkeleton className="h-11 w-11 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <LoadingSkeleton className="h-4 w-4/5" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                  <LoadingSkeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}

export default function AppRootLoading() {
  return <AppRootLoadingShell />;
}
