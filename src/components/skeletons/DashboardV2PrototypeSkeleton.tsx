import { LoadingSkeleton } from "@/design-system";
import { CreatorResourceFormLoadingShellPreview } from "@/components/creator/CreatorResourceFormLoadingShell";
import { DashboardPageSkeletonShell } from "@/components/dashboard/DashboardPageShell";

function SidebarSkeleton() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border-subtle bg-card lg:flex lg:min-h-dvh lg:flex-col">
      <div className="border-b border-border-subtle px-5 py-4">
        <div className="flex items-center">
          <LoadingSkeleton className="h-[36px] w-[148px] rounded-lg" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-3 py-5">
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <LoadingSkeleton className="ml-3 h-3 w-16" />
            <div className="space-y-1">
              {Array.from({ length: groupIndex === 0 ? 4 : 3 }).map(
                (_, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  >
                    <LoadingSkeleton className="size-4 rounded" />
                    <LoadingSkeleton className="h-4 w-28" />
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border-subtle p-4">
        <div className="rounded-xl border border-border-subtle bg-muted/50 p-4">
          <LoadingSkeleton className="h-5 w-24 rounded-full" />
          <LoadingSkeleton className="mt-4 h-4 w-32" />
          <LoadingSkeleton className="mt-2 h-3 w-full" />
          <LoadingSkeleton className="mt-2 h-3 w-3/4" />
          <LoadingSkeleton className="mt-4 h-9 w-full rounded-xl" />
        </div>
      </div>
    </aside>
  );
}

function TopbarSkeleton() {
  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-background/95 px-4 pt-3 pb-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-xl lg:hidden">
          <LoadingSkeleton className="size-5 rounded-md" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="w-full max-w-2xl">
            <div className="relative w-full">
              <div className="h-11 w-full rounded-xl border border-input bg-background" />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <LoadingSkeleton className="size-4 rounded-full bg-muted-foreground/25" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-11 flex items-center">
                <LoadingSkeleton className="h-4 w-52 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>

        <div className="inline-flex size-11 items-center justify-center rounded-xl">
          <LoadingSkeleton className="size-5 rounded-md" />
        </div>

        <div className="inline-flex size-11 items-center justify-center rounded-full border border-border-subtle bg-card/90">
          <LoadingSkeleton className="size-8 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export function DashboardV2ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <SidebarSkeleton />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopbarSkeleton />
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}

export function DashboardV2PrototypeSkeleton() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <SidebarSkeleton />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopbarSkeleton />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              <section className="border-b border-border-subtle pb-6">
                <LoadingSkeleton className="h-5 w-32 rounded-full" />
                <LoadingSkeleton className="mt-4 h-10 w-full max-w-3xl rounded-2xl" />
                <LoadingSkeleton className="mt-3 h-4 w-full max-w-2xl" />
                <LoadingSkeleton className="mt-2 h-4 w-full max-w-xl" />
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-7 w-48" />
                    <LoadingSkeleton className="h-4 w-80 max-w-full" />
                  </div>
                  <LoadingSkeleton className="hidden h-4 w-32 md:block" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border-subtle bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3">
                          <LoadingSkeleton className="h-3 w-24" />
                          <LoadingSkeleton className="h-8 w-16" />
                        </div>
                        <LoadingSkeleton className="size-9 rounded-xl" />
                      </div>
                      <LoadingSkeleton className="mt-5 h-3 w-32" />
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="rounded-xl border border-border-subtle bg-card p-5">
                    <LoadingSkeleton className="h-5 w-40" />
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-border-subtle bg-background p-3"
                        >
                          <LoadingSkeleton className="h-24 rounded-lg" />
                          <LoadingSkeleton className="mt-3 h-4 w-full" />
                          <LoadingSkeleton className="mt-2 h-3 w-2/3" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-card p-5">
                    <LoadingSkeleton className="h-5 w-32" />
                    <div className="mt-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex gap-3">
                          <LoadingSkeleton className="size-9 rounded-xl" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <LoadingSkeleton className="h-4 w-3/4" />
                            <LoadingSkeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function DashboardV2NeutralRouteSkeleton() {
  return (
    <DashboardPageSkeletonShell>
      <div className="flex flex-col gap-8" data-loading-scope="dashboard-v2-neutral">
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-24 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-2xl" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
            <div className="border-b border-border-subtle px-5 py-5">
              <LoadingSkeleton className="h-5 w-40" />
              <LoadingSkeleton className="mt-2 h-4 w-64 max-w-full" />
            </div>
            <div className="space-y-4 px-5 py-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border-subtle bg-card p-5"
              >
                <LoadingSkeleton className="h-5 w-28" />
                <LoadingSkeleton className="mt-3 h-4 w-full max-w-[220px]" />
                <LoadingSkeleton className="mt-2 h-4 w-5/6" />
                <LoadingSkeleton className="mt-5 h-9 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardPageSkeletonShell>
  );
}

export function DashboardV2CreatorNeutralRouteSkeleton() {
  return (
    <DashboardPageSkeletonShell>
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-creator-neutral"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-28 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-2xl" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
            <div className="border-b border-border-subtle px-5 py-5">
              <LoadingSkeleton className="h-5 w-44" />
              <LoadingSkeleton className="mt-2 h-4 w-72 max-w-full" />
            </div>
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border-subtle bg-muted/30 p-4">
                  <LoadingSkeleton className="h-3 w-24" />
                  <LoadingSkeleton className="mt-3 h-7 w-16" />
                  <LoadingSkeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border-subtle bg-card p-5">
              <LoadingSkeleton className="h-5 w-32" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <LoadingSkeleton className="h-4 w-3/4" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-card p-5">
              <LoadingSkeleton className="h-5 w-28" />
              <LoadingSkeleton className="mt-3 h-4 w-full max-w-[220px]" />
              <LoadingSkeleton className="mt-2 h-4 w-5/6" />
              <LoadingSkeleton className="mt-5 h-9 w-32 rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </DashboardPageSkeletonShell>
  );
}

export function DashboardV2RouteContentSkeleton({
  variant = "home",
}: {
  variant?:
    | "home"
    | "library"
    | "downloads"
    | "purchases"
    | "membership"
    | "settings"
    | "creator"
    | "creator-resources"
    | "creator-editor"
    | "creator-analytics"
    | "creator-earnings"
    | "creator-sales"
    | "creator-payouts"
    | "creator-profile"
    | "creator-settings";
}) {
  return (
    <DashboardPageSkeletonShell>
      <DashboardV2RouteContentSkeletonBody variant={variant} />
    </DashboardPageSkeletonShell>
  );
}

function DashboardV2RouteContentSkeletonBody({
  variant = "home",
}: {
  variant?:
    | "home"
    | "library"
    | "downloads"
    | "purchases"
    | "membership"
    | "settings"
    | "creator"
    | "creator-resources"
    | "creator-editor"
    | "creator-analytics"
    | "creator-earnings"
    | "creator-sales"
    | "creator-payouts"
    | "creator-profile"
    | "creator-settings";
}) {
  const isCreatorRoute = variant.startsWith("creator");
  const isCreatorWorkspace = variant === "creator";
  const isHomeRoute = variant === "home";
  const isLibraryRoute = variant === "library";
  const isDownloadsRoute = variant === "downloads";
  const isPurchasesRoute = variant === "purchases";
  const isSettingsRoute = variant === "settings";
  const isMembershipRoute = variant === "membership";

  if (variant === "creator-profile") {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-creator-profile"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-28 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-40 rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
          <LoadingSkeleton className="mt-4 h-9 w-36 rounded-xl" />
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border-subtle bg-card p-4"
            >
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="mt-3 h-7 w-36" />
              <LoadingSkeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="space-y-6 rounded-2xl border border-border-subtle bg-card p-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <LoadingSkeleton className="h-5 w-32" />
                <div className="grid gap-4 md:grid-cols-2">
                  <LoadingSkeleton className="h-20 rounded-xl" />
                  <LoadingSkeleton className="h-20 rounded-xl" />
                </div>
                <LoadingSkeleton className="h-36 rounded-xl" />
                <div className="grid gap-4 md:grid-cols-2">
                  <LoadingSkeleton className="h-20 rounded-xl" />
                  <LoadingSkeleton className="h-20 rounded-xl" />
                </div>
              </div>

              <div className="space-y-4">
                <LoadingSkeleton className="h-5 w-28" />
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <LoadingSkeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border-subtle bg-muted p-4">
                <div className="flex gap-4">
                  <LoadingSkeleton className="size-28 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <LoadingSkeleton className="h-4 w-32" />
                    <LoadingSkeleton className="h-4 w-full max-w-[240px]" />
                    <LoadingSkeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-muted p-4">
                <LoadingSkeleton className="h-4 w-28" />
                <LoadingSkeleton className="mt-3 h-40 rounded-xl" />
                <LoadingSkeleton className="mt-3 h-3 w-40" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-card px-5 py-4">
            <LoadingSkeleton className="h-4 w-56" />
            <LoadingSkeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "creator-settings") {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-creator-settings"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-32 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-44 rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
          <LoadingSkeleton className="mt-4 h-9 w-28 rounded-xl" />
        </section>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
          <div className="border-b border-border-subtle px-5 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <LoadingSkeleton className="h-6 w-40" />
                <LoadingSkeleton className="mt-2 h-4 w-full max-w-lg" />
              </div>
              <LoadingSkeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
              >
                <div className="space-y-2">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-4 w-full max-w-xl" />
                </div>
                <LoadingSkeleton className="h-6 w-24 rounded-full" />
                <LoadingSkeleton className="h-9 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isCreatorWorkspace) {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope={`dashboard-v2-${variant}`}
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-28 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-56 rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-md" />
          <div className="mt-4 flex gap-2">
            <LoadingSkeleton className="h-9 w-24 rounded-xl" />
            <LoadingSkeleton className="h-9 w-24 rounded-xl" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex items-center justify-between gap-4 xl:col-span-2">
              <div className="space-y-2">
                <LoadingSkeleton className="h-7 w-28" />
                <LoadingSkeleton className="h-4 w-72 max-w-full" />
              </div>
              <LoadingSkeleton className="hidden h-9 w-28 rounded-xl md:block" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border-subtle bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-3">
                        <LoadingSkeleton className="h-3 w-24" />
                        <LoadingSkeleton className="h-8 w-16" />
                      </div>
                      <LoadingSkeleton className="size-9 rounded-xl" />
                    </div>
                    <LoadingSkeleton className="mt-5 h-3 w-32" />
                  </div>
                ))}
              </div>

              <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-card">
                <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-5 w-36" />
                    <LoadingSkeleton className="h-4 w-72 max-w-full" />
                  </div>
                  <LoadingSkeleton className="hidden h-9 w-32 rounded-xl md:block" />
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div className="grid min-w-[680px] grid-cols-[minmax(0,1fr)_128px_128px_144px] gap-4 border-b border-border-subtle px-5 py-3">
                    <LoadingSkeleton className="h-3 w-20" />
                    <LoadingSkeleton className="h-3 w-14" />
                    <LoadingSkeleton className="h-3 w-16" />
                    <LoadingSkeleton className="h-3 w-20" />
                  </div>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid min-w-[680px] grid-cols-[minmax(0,1fr)_128px_128px_144px] gap-4 border-b border-border-subtle px-5 py-4"
                    >
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-5 w-16 rounded-full" />
                      <LoadingSkeleton className="h-4 w-14" />
                      <LoadingSkeleton className="h-4 w-14" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-card p-5">
              <LoadingSkeleton className="h-5 w-20" />
              <LoadingSkeleton className="mt-2 h-4 w-40" />
              <div className="mt-4 space-y-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <LoadingSkeleton className="size-9 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <LoadingSkeleton className="h-4 w-24" />
                      <LoadingSkeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-border-subtle bg-card"
              >
                <div className="border-b border-border-subtle px-5 py-4">
                  <LoadingSkeleton className="h-6 w-36" />
                  <LoadingSkeleton className="mt-2 h-4 w-56 max-w-full" />
                </div>
                <div className="divide-y divide-border-subtle px-5">
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid gap-2 py-4 md:grid-cols-[150px_minmax(0,1fr)]"
                    >
                      <LoadingSkeleton className="h-4 w-24" />
                      <LoadingSkeleton className="h-4 w-full max-w-sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (isHomeRoute) {
    return (
      <div className="flex flex-col gap-8" data-loading-scope="dashboard-v2-home">
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-20 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-md rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
          <div className="mt-4 flex gap-2">
            <LoadingSkeleton className="h-9 w-28 rounded-xl" />
            <LoadingSkeleton className="h-9 w-28 rounded-xl" />
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border-subtle bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <LoadingSkeleton className="h-3 w-24" />
                  <LoadingSkeleton className="h-8 w-20" />
                </div>
                <LoadingSkeleton className="size-9 rounded-xl" />
              </div>
              <LoadingSkeleton className="mt-5 h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-xl border border-border-subtle bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <LoadingSkeleton className="h-5 w-40" />
                <LoadingSkeleton className="h-4 w-56 max-w-full" />
              </div>
              <LoadingSkeleton className="h-9 w-20 rounded-xl" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border-subtle bg-background p-3"
                >
                  <LoadingSkeleton className="h-28 rounded-lg" />
                  <LoadingSkeleton className="mt-3 h-4 w-full" />
                  <LoadingSkeleton className="mt-2 h-3 w-2/3" />
                  <LoadingSkeleton className="mt-3 h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border-subtle bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <LoadingSkeleton className="h-5 w-28" />
                  <LoadingSkeleton className="h-4 w-56 max-w-full" />
                </div>
                <LoadingSkeleton className="h-5 w-16 rounded-full" />
              </div>
              <LoadingSkeleton className="mt-5 h-4 w-full max-w-[220px]" />
              <LoadingSkeleton className="mt-2 h-4 w-full max-w-[280px]" />
              <LoadingSkeleton className="mt-5 h-9 w-32 rounded-xl" />
            </div>

            <div className="rounded-xl border border-border-subtle bg-card p-5">
              <LoadingSkeleton className="h-5 w-32" />
              <div className="mt-4 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <LoadingSkeleton className="size-9 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLibraryRoute) {
    return (
      <div className="flex flex-col gap-8" data-loading-scope="dashboard-v2-library">
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-16 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-md rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <LoadingSkeleton className="h-5 w-36" />
            <div className="mt-3 flex flex-wrap gap-3">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="mt-3 h-5 w-40" />
            <LoadingSkeleton className="mt-2 h-4 w-32" />
            <LoadingSkeleton className="mt-4 h-9 w-32 rounded-xl" />
          </div>
        </section>

        <div className="rounded-xl border border-border-subtle bg-card p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <LoadingSkeleton className="h-5 w-28" />
                <LoadingSkeleton className="h-4 w-56 max-w-full" />
              </div>
              <div className="flex gap-3">
                <LoadingSkeleton className="h-10 flex-1 rounded-xl" />
                <LoadingSkeleton className="h-10 w-24 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3 xl:w-72">
              <LoadingSkeleton className="h-4 w-24 xl:ml-auto" />
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {Array.from({ length: 4 }).map((_, index) => (
                  <LoadingSkeleton
                    key={index}
                    className="h-8 w-20 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border-subtle bg-card"
            >
              <LoadingSkeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <LoadingSkeleton className="h-5 w-5/6" />
                <LoadingSkeleton className="h-4 w-1/2" />
                <LoadingSkeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isDownloadsRoute) {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-downloads"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-20 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-md rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <LoadingSkeleton className="h-5 w-28" />
            <div className="mt-3 flex flex-wrap gap-3">
              <LoadingSkeleton className="h-4 w-40" />
              <LoadingSkeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <LoadingSkeleton className="h-4 w-28" />
            <LoadingSkeleton className="mt-3 h-5 w-44" />
            <LoadingSkeleton className="mt-2 h-4 w-full max-w-[240px]" />
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
          <div className="grid grid-cols-[minmax(0,1.8fr)_110px] gap-4 border-b border-border-subtle bg-muted/40 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_90px_110px]">
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="h-3 w-16 justify-self-end md:hidden" />
            <LoadingSkeleton className="hidden h-3 w-16 md:block" />
            <LoadingSkeleton className="hidden h-3 w-20 md:block" />
            <LoadingSkeleton className="hidden h-3 w-12 md:block" />
            <LoadingSkeleton className="h-3 w-16 justify-self-end" />
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1.8fr)_110px] gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_90px_110px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <LoadingSkeleton className="size-10 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <LoadingSkeleton className="h-4 w-5/6" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <LoadingSkeleton className="hidden h-4 w-20 md:block" />
                <LoadingSkeleton className="hidden h-4 w-20 md:block" />
                <LoadingSkeleton className="hidden h-4 w-14 md:block" />
                <LoadingSkeleton className="h-8 w-24 justify-self-end rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isPurchasesRoute) {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-purchases"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-20 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-md rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <LoadingSkeleton className="h-5 w-24" />
            <div className="mt-3 flex flex-wrap gap-3">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="mt-3 h-5 w-48" />
            <LoadingSkeleton className="mt-2 h-4 w-full max-w-[220px]" />
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
          <div className="grid grid-cols-[minmax(0,1.9fr)_110px] gap-4 border-b border-border-subtle bg-muted/40 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_120px]">
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="h-3 w-16 justify-self-end md:hidden" />
            <LoadingSkeleton className="hidden h-3 w-16 md:block" />
            <LoadingSkeleton className="hidden h-3 w-14 md:block" />
            <LoadingSkeleton className="hidden h-3 w-16 md:block" />
            <LoadingSkeleton className="h-3 w-16 justify-self-end" />
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(0,1.9fr)_110px] gap-4 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_110px_120px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <LoadingSkeleton className="size-10 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <LoadingSkeleton className="h-4 w-5/6" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <LoadingSkeleton className="hidden h-4 w-20 md:block" />
                <LoadingSkeleton className="hidden h-4 w-20 md:block" />
                <LoadingSkeleton className="hidden h-4 w-16 md:block" />
                <LoadingSkeleton className="h-6 w-20 justify-self-end rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isMembershipRoute) {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-membership"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-24 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-md rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
          <div className="mt-4 flex gap-2">
            <LoadingSkeleton className="h-9 w-28 rounded-xl" />
            <LoadingSkeleton className="h-9 w-28 rounded-xl" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border-subtle bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <LoadingSkeleton className="h-3 w-20" />
                  <LoadingSkeleton className="h-5 w-28" />
                </div>
                {index === 0 ? (
                  <LoadingSkeleton className="h-6 w-16 rounded-full" />
                ) : null}
              </div>
              <LoadingSkeleton className="mt-4 h-4 w-full max-w-[220px]" />
              <LoadingSkeleton className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </section>

        <div className="rounded-xl border border-border-subtle bg-card p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <LoadingSkeleton className="h-6 w-20 rounded-full" />
                <LoadingSkeleton className="h-3 w-36" />
              </div>
              <LoadingSkeleton className="mt-4 h-8 w-full max-w-md" />
              <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
              <LoadingSkeleton className="mt-2 h-4 w-5/6" />
              <LoadingSkeleton className="mt-4 h-4 w-full max-w-lg" />
            </div>
            <div className="flex w-full flex-col gap-3 lg:w-[180px]">
              <LoadingSkeleton className="h-9 w-full rounded-xl" />
              <LoadingSkeleton className="h-9 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSettingsRoute) {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-settings"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-20 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
        </section>

        <div className="divide-y divide-border-subtle border-b border-border-subtle">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <section
              key={sectionIndex}
              className="grid gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10"
            >
              <div className="space-y-2">
                <LoadingSkeleton className="h-6 w-28" />
                <LoadingSkeleton className="h-4 w-full max-w-[180px]" />
                <LoadingSkeleton className="h-4 w-full max-w-[150px]" />
              </div>
              {sectionIndex === 0 ? (
                <div className="min-w-0">
                  <div className="flex items-start gap-4 border-b border-border-subtle pb-5">
                    <LoadingSkeleton className="size-14 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <LoadingSkeleton className="h-5 w-40" />
                      <LoadingSkeleton className="mt-2 h-4 w-full max-w-md" />
                    </div>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="grid gap-2 py-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
                      >
                        <LoadingSkeleton className="h-3 w-20" />
                        <LoadingSkeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : sectionIndex === 1 ? (
                <div className="divide-y divide-border-subtle">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid gap-2 py-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
                    >
                      <LoadingSkeleton className="h-3 w-24" />
                      <div className="space-y-2">
                        <LoadingSkeleton className="h-4 w-28" />
                        {index === 4 ? (
                          <>
                            <LoadingSkeleton className="h-4 w-full max-w-xl" />
                            <LoadingSkeleton className="h-4 w-5/6" />
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid gap-2 py-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6"
                    >
                      <LoadingSkeleton className="h-3 w-24" />
                      <div className="space-y-2">
                        {index === 2 ? (
                          <>
                            <LoadingSkeleton className="h-4 w-36" />
                            <LoadingSkeleton className="h-4 w-32" />
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <LoadingSkeleton className="h-4 w-24" />
                                  <LoadingSkeleton className="mt-2 h-4 w-36" />
                                </div>
                                <LoadingSkeleton className="size-4 rounded" />
                              </div>
                              <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-3">
                                <div className="min-w-0 flex-1">
                                  <LoadingSkeleton className="h-4 w-24" />
                                  <LoadingSkeleton className="mt-2 h-4 w-40" />
                                </div>
                                <LoadingSkeleton className="size-4 rounded" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <LoadingSkeleton className="h-4 w-full max-w-xl" />
                            <LoadingSkeleton className="h-4 w-5/6" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "creator-resources") {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-creator-resources"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-32 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
          <LoadingSkeleton className="mt-4 h-9 w-32 rounded-xl" />
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border-subtle bg-card p-4"
              >
                <LoadingSkeleton className="h-3 w-20" />
                <LoadingSkeleton className="mt-3 h-8 w-14" />
                <LoadingSkeleton className="mt-2 h-3 w-28" />
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-5 w-40" />
                    <LoadingSkeleton className="h-4 w-56 max-w-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <LoadingSkeleton className="h-8 w-24 rounded-full" />
                    <LoadingSkeleton className="h-9 w-28 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-5 border-t border-border-subtle pt-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <LoadingSkeleton
                        key={index}
                        className="h-9 rounded-xl sm:h-10"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_128px_144px_128px_128px_128px_112px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-3 w-16" />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_128px_144px_128px_128px_128px_112px] gap-4 border-b border-border-subtle px-5 py-4"
                >
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-4 w-3/4" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                  <LoadingSkeleton className="h-5 w-20 rounded-full" />
                  <LoadingSkeleton className="h-4 w-16" />
                  <LoadingSkeleton className="h-4 w-14" />
                  <LoadingSkeleton className="h-4 w-14" />
                  <LoadingSkeleton className="h-4 w-20" />
                  <LoadingSkeleton className="h-8 w-16 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-border-subtle bg-muted/20 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <LoadingSkeleton className="h-4 w-44" />
              <div className="flex flex-wrap gap-2">
                <LoadingSkeleton className="h-8 w-20 rounded-lg" />
                <LoadingSkeleton className="h-8 w-10 rounded-lg" />
                <LoadingSkeleton className="h-8 w-10 rounded-lg" />
                <LoadingSkeleton className="h-8 w-10 rounded-lg" />
                <LoadingSkeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (variant === "creator-editor") {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-creator-editor"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-32 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
        </section>

        <section>
          <CreatorResourceFormLoadingShellPreview />
        </section>
      </div>
    );
  }

  if (variant === "creator-analytics") {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope="dashboard-v2-creator-analytics"
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-32 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-2xl" />
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border-subtle bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-3 w-24" />
                    <LoadingSkeleton className="h-8 w-16" />
                  </div>
                  <LoadingSkeleton className="size-9 rounded-xl" />
                </div>
                <LoadingSkeleton className="mt-5 h-3 w-28" />
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-5">
              <div className="space-y-2">
                <LoadingSkeleton className="h-5 w-32" />
                <LoadingSkeleton className="h-4 w-60 max-w-full" />
              </div>
              <LoadingSkeleton className="hidden h-9 w-32 rounded-xl md:block" />
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_144px_112px_128px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="h-3 w-16" />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_144px_112px_128px] gap-4 border-b border-border-subtle px-5 py-4"
                >
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-4 w-20" />
                  <LoadingSkeleton className="h-4 w-14" />
                  <LoadingSkeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, panelIndex) => (
              <div
                key={panelIndex}
                className="overflow-hidden rounded-xl border border-border-subtle bg-card"
              >
                <div className="border-b border-border-subtle px-5 py-5">
                  <LoadingSkeleton className="h-5 w-32" />
                  <LoadingSkeleton className="mt-2 h-4 w-56 max-w-full" />
                </div>
                <div className="overflow-x-auto">
                  <div
                    className={
                      panelIndex === 0
                        ? "grid min-w-[760px] grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3"
                        : "grid min-w-[560px] grid-cols-[minmax(0,1fr)_176px_128px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3"
                    }
                  >
                    {Array.from({ length: panelIndex === 0 ? 6 : 3 }).map((_, index) => (
                      <LoadingSkeleton key={index} className="h-3 w-16" />
                    ))}
                  </div>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className={
                        panelIndex === 0
                          ? "grid min-w-[760px] grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px] gap-4 border-b border-border-subtle px-5 py-4"
                          : "grid min-w-[560px] grid-cols-[minmax(0,1fr)_176px_128px] gap-4 border-b border-border-subtle px-5 py-4"
                      }
                    >
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-4 w-24" />
                      {panelIndex === 0 ? (
                        <>
                          <LoadingSkeleton className="h-4 w-16" />
                          <LoadingSkeleton className="h-4 w-16" />
                          <LoadingSkeleton className="h-5 w-20 rounded-full" />
                        </>
                      ) : null}
                      <LoadingSkeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (
    variant === "creator-earnings" ||
    variant === "creator-sales" ||
    variant === "creator-payouts"
  ) {
    return (
      <div
        className="flex flex-col gap-8"
        data-loading-scope={`dashboard-v2-${variant}`}
      >
        <section className="border-b border-border-subtle pb-6">
          <LoadingSkeleton className="h-5 w-32 rounded-full" />
          <LoadingSkeleton className="mt-4 h-10 w-full max-w-lg rounded-2xl" />
          <LoadingSkeleton className="mt-3 h-4 w-full max-w-2xl" />
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border-subtle bg-card p-4"
              >
                <LoadingSkeleton className="h-3 w-24" />
                <LoadingSkeleton className="mt-3 h-8 w-20" />
                <LoadingSkeleton className="mt-2 h-3 w-32" />
              </div>
            ))}
          </div>

          {Array.from({ length: 2 }).map((_, panelIndex) => (
            <div
              key={panelIndex}
              className="overflow-hidden rounded-xl border border-border-subtle bg-card"
            >
              <div className="border-b border-border-subtle px-5 py-5">
                <LoadingSkeleton className="h-6 w-36" />
                <LoadingSkeleton className="mt-2 h-4 w-72 max-w-full" />
              </div>
              <div className="overflow-x-auto">
                <div
                  className={
                    panelIndex === 0
                      ? "grid min-w-[860px] grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3"
                      : "grid min-w-[520px] grid-cols-[minmax(0,1fr)_128px_128px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3"
                  }
                >
                  {Array.from({ length: panelIndex === 0 ? 6 : 3 }).map((_, index) => (
                    <LoadingSkeleton key={index} className="h-3 w-16" />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={
                      panelIndex === 0
                        ? "grid min-w-[860px] grid-cols-[minmax(0,1fr)_160px_112px_112px_112px_128px] gap-4 border-b border-border-subtle px-5 py-4"
                        : "grid min-w-[520px] grid-cols-[minmax(0,1fr)_128px_128px] gap-4 border-b border-border-subtle px-5 py-4"
                    }
                  >
                    <LoadingSkeleton className="h-4 w-3/4" />
                    <LoadingSkeleton className="h-4 w-20" />
                    {panelIndex === 0 ? (
                      <>
                        <LoadingSkeleton className="h-4 w-16" />
                        <LoadingSkeleton className="h-4 w-16" />
                        <LoadingSkeleton className="h-5 w-20 rounded-full" />
                      </>
                    ) : (
                      <LoadingSkeleton className="h-5 w-20 rounded-full" />
                    )}
                    <LoadingSkeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" data-loading-scope={`dashboard-v2-${variant}`}>
      <section className="border-b border-border-subtle pb-6">
        <LoadingSkeleton className="h-5 w-28 rounded-full" />
        <LoadingSkeleton className="mt-4 h-10 w-full max-w-2xl rounded-2xl" />
        <LoadingSkeleton className="mt-3 h-4 w-full max-w-xl" />
        <LoadingSkeleton className="mt-2 h-4 w-full max-w-lg" />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <LoadingSkeleton className="h-7 w-48" />
            <LoadingSkeleton className="h-4 w-80 max-w-full" />
          </div>
          <LoadingSkeleton className="hidden h-9 w-28 rounded-xl md:block" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: isCreatorRoute ? 3 : 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border-subtle bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <LoadingSkeleton className="h-3 w-24" />
                    <LoadingSkeleton className="h-8 w-16" />
                  </div>
                  <LoadingSkeleton className="size-9 rounded-xl" />
                </div>
                <LoadingSkeleton className="mt-5 h-3 w-32" />
              </div>
            ),
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-4 border-b border-border-subtle bg-muted/50 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_120px]">
            <LoadingSkeleton className="h-3 w-24" />
            <LoadingSkeleton className="h-3 w-16" />
            <LoadingSkeleton className="hidden h-3 w-16 sm:block" />
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: isCreatorRoute ? 4 : 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1fr)_90px] gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_120px_120px]"
                >
                  <div className="min-w-0 space-y-2">
                    <LoadingSkeleton className="h-4 w-3/4" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                  <LoadingSkeleton className="h-5 w-16 rounded-full" />
                  <LoadingSkeleton className="hidden h-8 w-20 rounded-lg sm:block" />
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
