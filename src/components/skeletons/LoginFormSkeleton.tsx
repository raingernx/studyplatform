"use client";

import { Skeleton } from "boneyard-js/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const LOGIN_FORM_SKELETON_NAME = "login-form";

export type LoginFormSkeletonVariant =
  | "base"
  | "verified"
  | "reset-success"
  | "check-email"
  | "invalid-verification"
  | "error";

function LoginStatusBannerSkeleton({
  variant,
}: {
  variant: Exclude<LoginFormSkeletonVariant, "base">;
}) {
  const widths =
    variant === "check-email"
      ? ["w-full", "w-5/6"]
      : variant === "invalid-verification"
        ? ["w-4/5"]
        : variant === "error"
          ? ["w-3/4"]
          : ["w-11/12"];

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <LoadingSkeleton className="mt-0.5 h-4 w-4 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        {widths.map((width) => (
          <LoadingSkeleton key={width} className={`h-4 ${width}`} />
        ))}
      </div>
    </div>
  );
}

function LoginFormSkeletonPreview({
  variant = "base",
}: {
  variant?: LoginFormSkeletonVariant;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <LoadingSkeleton className="mx-auto h-8 w-32 rounded-lg" />
          <LoadingSkeleton className="mx-auto mt-5 h-8 w-40 rounded-2xl" />
          <LoadingSkeleton className="mx-auto mt-2 h-4 w-56" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <LoadingSkeleton className="h-11 w-full rounded-xl" />

          <div className="relative my-5">
            <LoadingSkeleton className="h-px w-full rounded-none" />
            <LoadingSkeleton className="mx-auto mt-[-7px] h-4 w-28 rounded bg-card" />
          </div>

          <div className="space-y-4">
            {variant !== "base" ? <LoginStatusBannerSkeleton variant={variant} /> : null}

            <div className="space-y-1.5">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-11 w-full rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <LoadingSkeleton className="h-4 w-20" />
                <LoadingSkeleton className="h-4 w-24" />
              </div>
              <LoadingSkeleton className="h-11 w-full rounded-xl" />
            </div>

            <LoadingSkeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <LoadingSkeleton className="mx-auto mt-5 h-4 w-44" />
      </div>
    </div>
  );
}

function ManualLoginFormSkeleton({
  variant = "base",
}: {
  variant?: LoginFormSkeletonVariant;
}) {
  return <LoginFormSkeletonPreview variant={variant} />;
}

export function LoginFormSkeletonBonesPreview() {
  return (
    <Skeleton
      name={LOGIN_FORM_SKELETON_NAME}
      loading={false}
      className="w-full"
    >
      <LoginFormSkeletonPreview />
    </Skeleton>
  );
}

export function LoginFormSkeleton({
  variant = "base",
}: {
  variant?: LoginFormSkeletonVariant;
}) {
  return <ManualLoginFormSkeleton variant={variant} />;
}
