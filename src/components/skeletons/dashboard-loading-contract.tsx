"use client";

import type { ReactNode } from "react";

import { Skeleton } from "boneyard-js/react";

import { DashboardPageSkeletonShell } from "@/components/dashboard/DashboardPageShell";

export type DashboardLoadingWidth = "default" | "narrow";

export function dashboardBonesPreview(
  name: string,
  preview: ReactNode,
  options?: { width?: DashboardLoadingWidth },
) {
  return (
    <Skeleton name={name} loading={false} className="w-full">
      <DashboardPageSkeletonShell
        data-bones-preview={name}
        width={options?.width}
      >
        <div>{preview}</div>
      </DashboardPageSkeletonShell>
    </Skeleton>
  );
}

export function dashboardRuntimeShell(
  preview: ReactNode,
  scope: string,
  options?: { width?: DashboardLoadingWidth },
) {
  return (
    <DashboardPageSkeletonShell
      data-loading-scope={scope}
      width={options?.width}
    >
      {preview}
    </DashboardPageSkeletonShell>
  );
}
