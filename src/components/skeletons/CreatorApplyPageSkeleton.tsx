"use client";

import { Skeleton } from "boneyard-js/react";
import { Sparkles } from "lucide-react";
import { PageContent } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const CREATOR_APPLY_PAGE_SKELETON_NAME = "creator-apply-page";

export type CreatorApplyPageSkeletonVariant =
  | "status-shell"
  | "not-applied"
  | "pending"
  | "approved"
  | "rejected";

function CreatorApplyHeaderSkeleton() {
  return (
    <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-8 shadow-card">
      <div className="flex items-center gap-3">
        <LoadingSkeleton className="h-11 w-11 rounded-2xl" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-3.5 w-20 rounded-full" />
          <LoadingSkeleton className="h-9 w-56 rounded-2xl" />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <LoadingSkeleton className="h-4 w-full max-w-3xl" />
        <LoadingSkeleton className="h-4 w-4/5 max-w-2xl" />
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
  );
}

function CreatorApplyStatusPanelSkeleton({
  titleWidth,
  lineWidths,
  className,
}: {
  titleWidth: string;
  lineWidths: string[];
  className?: string;
}) {
  return (
    <div className={className ?? "rounded-2xl border border-border bg-card p-6 shadow-card"}>
      <div className="flex items-start gap-3">
        <LoadingSkeleton className="mt-0.5 h-5 w-5 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <LoadingSkeleton className={`h-5 ${titleWidth}`} />
          {lineWidths.map((width) => (
            <LoadingSkeleton key={width} className={`h-4 ${width}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CreatorApplyFormCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <LoadingSkeleton className="h-6 w-44" />
      <div className="mt-3 space-y-2">
        <LoadingSkeleton className="h-4 w-full max-w-2xl" />
        <LoadingSkeleton className="h-4 w-4/5 max-w-xl" />
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-36" />
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-12 w-full rounded-xl" />
          <LoadingSkeleton className="h-3.5 w-72" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <LoadingSkeleton className="ml-auto h-3.5 w-16" />
        </div>
        <LoadingSkeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function CreatorApplyRejectedPanelSkeleton() {
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
      <CreatorApplyStatusPanelSkeleton
        titleWidth="w-52"
        lineWidths={["w-full max-w-xl", "w-5/6 max-w-lg"]}
        className="rounded-none border-0 bg-transparent p-0 shadow-none"
      />
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="h-4 w-full max-w-lg" />
          <LoadingSkeleton className="h-4 w-5/6 max-w-md" />
        </div>
      </div>
      <div className="space-y-4">
        <LoadingSkeleton className="h-5 w-40" />
        <CreatorApplyFormCardSkeleton />
      </div>
    </div>
  );
}

function ManualCreatorApplyPageSkeleton({
  variant,
}: {
  variant: CreatorApplyPageSkeletonVariant;
}) {
  return (
    <PageContent className="space-y-8">
      <CreatorApplyHeaderSkeleton />

      {variant === "pending" ? (
        <CreatorApplyStatusPanelSkeleton
          titleWidth="w-48"
          lineWidths={["w-full max-w-2xl", "w-4/5 max-w-xl", "w-3/5 max-w-lg"]}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card"
        />
      ) : null}

      {variant === "approved" ? (
        <CreatorApplyStatusPanelSkeleton
          titleWidth="w-44"
          lineWidths={["w-full max-w-2xl", "w-5/6 max-w-xl", "w-2/3 max-w-lg"]}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-card"
        />
      ) : null}

      {variant === "rejected" ? <CreatorApplyRejectedPanelSkeleton /> : null}

      {variant === "not-applied" ? <CreatorApplyFormCardSkeleton /> : null}

      {variant === "status-shell" ? (
        <CreatorApplyStatusPanelSkeleton
          titleWidth="w-52"
          lineWidths={["w-full max-w-2xl", "w-4/5 max-w-xl"]}
        />
      ) : null}
    </PageContent>
  );
}

function CreatorApplyPagePreview() {
  return (
    <PageContent className="space-y-8">
      <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-8 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Creator program
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Apply to sell on Krukraft
            </h1>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm text-slate-700">
          <p>Tell us about your classroom niche, publishing goals, and sample materials.</p>
          <p>We use this information to review fit, quality, and launch readiness.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Share your teaching background",
            "Upload sample resources",
            "Describe your audience",
            "Show how you package files",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="mt-4 text-base font-semibold text-foreground">{item}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep this section concise so the review team can assess your fit quickly.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Application details</h2>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>Provide contact details, portfolio context, and a short teaching bio.</p>
          <p>We will use this to decide whether to open creator publishing access.</p>
        </div>
        <div className="mt-6 space-y-4">
          {[
            "Full name",
            "Email address",
            "Teaching focus",
            "Application notes",
          ].map((label, index) => (
            <div
              key={label}
              className={index === 3 ? "rounded-2xl border border-input bg-background p-4" : "flex h-12 items-center rounded-xl border border-input bg-background px-4 text-sm text-foreground"}
            >
              {index === 3 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    Add sample context, publishing goals, and why your materials are useful.
                  </p>
                </div>
              ) : (
                <span>{label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContent>
  );
}

export function CreatorApplyPageSkeletonBonesPreview() {
  return (
    <Skeleton
      name={CREATOR_APPLY_PAGE_SKELETON_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <CreatorApplyPagePreview />
    </Skeleton>
  );
}

export function CreatorApplyPageSkeleton({
  variant = "status-shell",
}: {
  variant?: CreatorApplyPageSkeletonVariant;
}) {
  return <ManualCreatorApplyPageSkeleton variant={variant} />;
}
