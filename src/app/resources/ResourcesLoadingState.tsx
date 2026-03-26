"use client";

import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/container";

export function ResourcesLoadingState({
}: {
  heroConfig?: never;
}) {
  const selectedSegment = useSelectedLayoutSegment();
  const searchParams = useSearchParams();

  if (selectedSegment !== null) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1 bg-zinc-50">
          <Container className="py-8 sm:py-10 lg:py-12">
            <div className="space-y-6 lg:space-y-9">
              <div className="space-y-3">
                <div className="h-4 w-40 rounded bg-surface-100" />
                <div className="h-10 w-3/4 max-w-2xl rounded-2xl bg-surface-100" />
                <div className="h-4 w-64 rounded bg-surface-100" />
              </div>

              <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
                <div className="aspect-[4/3] w-full rounded-[28px] border border-surface-200 bg-white/80 shadow-sm" />
                <div className="space-y-6 lg:order-3">
                  <div className="h-14 rounded-2xl border border-surface-200 bg-white/80" />
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="h-56 rounded-[28px] border border-surface-200 bg-white/80" />
                    <div className="h-56 rounded-[28px] border border-surface-200 bg-white/80" />
                  </div>
                </div>
                <div className="h-[440px] rounded-[28px] border border-surface-200 bg-white/85 shadow-sm lg:row-span-2" />
              </div>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const category = searchParams.get("category")?.trim();
  if (!category) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-50">
        <Navbar />

        <main className="flex-1">
          <section className="relative overflow-hidden border-b border-surface-200/80 bg-[radial-gradient(circle_at_top_left,rgba(224,231,255,0.78),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
            <Container className="space-y-4 py-4 sm:space-y-5 sm:py-6 lg:space-y-6 lg:py-7">
              <div className="h-[440px] rounded-[26px] border border-white/70 bg-surface-100/90 shadow-sm sm:h-[500px] lg:h-[540px]" />
            </Container>
          </section>

          <Container className="space-y-10 pb-12 pt-5 sm:space-y-12 sm:pb-14 sm:pt-6 lg:space-y-14 lg:pb-16 lg:pt-8">
            <div className="space-y-5 border-b border-surface-200/80 pb-7 sm:pb-8">
              <div className="h-5 w-44 rounded bg-surface-100" />
              <div className="flex gap-3">
                <div className="h-9 w-24 rounded-full border border-surface-200 bg-white/85" />
                <div className="h-9 flex-1 rounded-full border border-surface-200 bg-white/85 lg:max-w-md" />
              </div>
            </div>

            <div className="h-24 rounded-[28px] border border-surface-200 bg-white/80" />
            <div className="h-[420px] rounded-[32px] border border-surface-200 bg-white/80" />
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />

      <main className="flex-1">
        <Container className="space-y-12 py-12 sm:space-y-14 sm:py-14 lg:space-y-16 lg:py-16">
          <div className="space-y-5 border-b border-surface-200/80 pb-6">
            <div className="h-5 w-40 rounded bg-surface-100" />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-11 rounded-full border border-surface-200 bg-white/85 lg:w-[420px]" />
              <div className="flex gap-2">
                <div className="h-10 w-28 rounded-full border border-surface-200 bg-white/85" />
                <div className="h-10 w-32 rounded-full border border-surface-200 bg-white/85" />
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[252px_minmax(0,1fr)]">
            <div className="hidden h-[460px] rounded-[28px] border border-surface-200 bg-white/80 lg:block" />
            <div className="h-[560px] rounded-[32px] border border-surface-200 bg-white/80" />
          </div>
        </Container>
      </main>
    </div>
  );
}
