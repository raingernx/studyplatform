"use client";

import { Skeleton } from "boneyard-js/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const CREATOR_RESOURCE_FORM_NAME = "creator-resource-form";

export function CreatorResourceFormLoadingShellPreview() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6 lg:space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 space-y-2">
            <LoadingSkeleton className="h-6 w-40" />
            <LoadingSkeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-28" />
              <LoadingSkeleton className="h-36 w-full rounded-3xl" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 space-y-2">
            <LoadingSkeleton className="h-6 w-44" />
            <LoadingSkeleton className="h-4 w-full max-w-sm" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
            <div className="space-y-3">
              <LoadingSkeleton className="h-4 w-28" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
          </div>

          <LoadingSkeleton className="mt-4 h-5 w-40 rounded-xl" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 space-y-2">
            <LoadingSkeleton className="h-6 w-48" />
            <LoadingSkeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="space-y-5">
            <div className="space-y-3 rounded-xl border border-border bg-muted p-4">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-28 w-full rounded-3xl" />
              <LoadingSkeleton className="h-20 w-full rounded-2xl" />
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted p-4">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-10 w-52 rounded-xl" />
              <LoadingSkeleton className="h-28 w-full rounded-3xl" />
              <LoadingSkeleton className="h-11 w-full rounded-2xl" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="space-y-3">
            <LoadingSkeleton className="h-6 w-56" />
            <LoadingSkeleton className="h-4 w-full max-w-sm" />
            <div className="flex flex-wrap gap-2">
              <LoadingSkeleton className="h-10 w-28 rounded-xl" />
              <LoadingSkeleton className="h-10 w-36 rounded-xl" />
              <LoadingSkeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex flex-wrap justify-end gap-3">
            <LoadingSkeleton className="h-10 w-24 rounded-xl" />
            <LoadingSkeleton className="h-10 w-32 rounded-xl" />
            <LoadingSkeleton className="h-10 w-32 rounded-xl" />
          </div>
        </section>
      </div>

      <aside className="hidden lg:block">
        <div className="space-y-3">
          <LoadingSkeleton className="h-4 w-28" />
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <LoadingSkeleton className="h-[332px] w-full rounded-2xl" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function CreatorResourceFormLoadingShellFallback() {
  return <CreatorResourceFormLoadingShellPreview />;
}

export function CreatorResourceFormLoadingShell() {
  return <CreatorResourceFormLoadingShellFallback />;
}

export function CreatorResourceFormLoadingShellBonesPreview() {
  return (
    <Skeleton
      loading={false}
      name={CREATOR_RESOURCE_FORM_NAME}
      className="w-full"
    >
      <CreatorResourceFormLoadingShellPreview />
    </Skeleton>
  );
}
