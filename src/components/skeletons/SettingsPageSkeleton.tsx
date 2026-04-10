"use client";

import { Skeleton } from "boneyard-js/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  DashboardPageHeader,
  DashboardPageHeaderSkeleton,
} from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageSkeletonShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";
import { dashboardRuntimeShell } from "@/components/skeletons/dashboard-loading-contract";

const SETTINGS_PAGE_SKELETON_NAME = "settings-page";

function SectionHeadingSkeleton({
  titleWidth,
  descriptionWidth,
}: {
  titleWidth: string;
  descriptionWidth: string;
}) {
  return (
    <div className="space-y-2">
      <LoadingSkeleton className={`h-5 rounded-md ${titleWidth}`} />
      <LoadingSkeleton className={`h-4 rounded-md ${descriptionWidth}`} />
    </div>
  );
}

function ManualSettingsPageSkeleton() {
  return (
    <DashboardPageSkeletonShell width="narrow">
      <DashboardPageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-72" />

      <div className="space-y-0">
        <section className="space-y-5 border-b border-border pb-6">
          <SectionHeadingSkeleton titleWidth="w-24" descriptionWidth="w-72" />
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <LoadingSkeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-16 rounded-md" />
                <LoadingSkeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-24 rounded-md" />
                  <LoadingSkeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        </section>

        <section className="space-y-5 border-b border-border pb-6 pt-6">
          <SectionHeadingSkeleton titleWidth="w-28" descriptionWidth="w-80" />
          <div className="space-y-1.5">
            <LoadingSkeleton className="h-4 w-28 rounded-md" />
            <LoadingSkeleton className="h-4 w-full max-w-md rounded-md" />
            <LoadingSkeleton className="h-4 w-48 rounded-md" />
          </div>
          <LoadingSkeleton className="h-9 w-36 rounded-xl" />
        </section>

        <section className="space-y-5 border-b border-border pb-6 pt-6">
          <SectionHeadingSkeleton titleWidth="w-36" descriptionWidth="w-80" />
          <LoadingSkeleton className="h-4 w-56 rounded-md" />
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-3">
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-32 rounded-md" />
                  <LoadingSkeleton className="h-4 w-64 rounded-md" />
                </div>
                <LoadingSkeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 border-b border-border pb-6 pt-6">
          <SectionHeadingSkeleton titleWidth="w-32" descriptionWidth="w-72" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_240px] md:gap-6"
              >
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-28 rounded-md" />
                  <LoadingSkeleton className="h-4 w-64 rounded-md" />
                </div>
                <LoadingSkeleton className="h-11 w-full max-w-xs rounded-xl" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <LoadingSkeleton className="h-4 w-28 rounded-md" />
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        </section>

        <div className="pt-6">
          <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-4">
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-36 rounded-md" />
              <LoadingSkeleton className="h-4 w-64 rounded-md" />
            </div>
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardPageSkeletonShell>
  );
}

export function SettingsTabsSkeleton() {
  return (
    <div className="space-y-0">
      <section className="space-y-5 border-b border-border pb-6">
        <SectionHeadingSkeleton titleWidth="w-24" descriptionWidth="w-72" />
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <LoadingSkeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-16 rounded-md" />
              <LoadingSkeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-24 rounded-md" />
                <LoadingSkeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <LoadingSkeleton className="h-9 w-32 rounded-xl" />
        </div>
      </section>

      <section className="space-y-5 border-b border-border pb-6 pt-6">
        <SectionHeadingSkeleton titleWidth="w-28" descriptionWidth="w-80" />
        <div className="space-y-1.5">
          <LoadingSkeleton className="h-4 w-28 rounded-md" />
          <LoadingSkeleton className="h-4 w-full max-w-md rounded-md" />
          <LoadingSkeleton className="h-4 w-48 rounded-md" />
        </div>
        <LoadingSkeleton className="h-9 w-36 rounded-xl" />
      </section>

      <section className="space-y-5 border-b border-border pb-6 pt-6">
        <SectionHeadingSkeleton titleWidth="w-36" descriptionWidth="w-80" />
        <LoadingSkeleton className="h-4 w-56 rounded-md" />
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-32 rounded-md" />
                <LoadingSkeleton className="h-4 w-64 rounded-md" />
              </div>
              <LoadingSkeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5 border-b border-border pb-6 pt-6">
        <SectionHeadingSkeleton titleWidth="w-32" descriptionWidth="w-72" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_240px] md:gap-6"
            >
              <div className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-28 rounded-md" />
                <LoadingSkeleton className="h-4 w-64 rounded-md" />
              </div>
              <LoadingSkeleton className="h-11 w-full max-w-xs rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <LoadingSkeleton className="h-4 w-28 rounded-md" />
          <LoadingSkeleton className="h-9 w-32 rounded-xl" />
        </div>
      </section>

      <div className="pt-6">
        <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-4">
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-36 rounded-md" />
            <LoadingSkeleton className="h-4 w-64 rounded-md" />
          </div>
          <LoadingSkeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function PreviewSettingsRow({
  label,
  hint,
  valueWidth = "w-full max-w-xs",
}: {
  label: string;
  hint: string;
  valueWidth?: string;
}) {
  return (
    <div className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_240px] md:gap-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-small text-muted-foreground">{hint}</p>
      </div>
      <div className={`flex h-11 items-center rounded-xl border border-input bg-background px-4 text-sm text-foreground ${valueWidth}`}>
        <LoadingSkeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function SettingsPagePreview() {
  return (
    <DashboardPageSkeletonShell width="narrow" data-bones-preview={SETTINGS_PAGE_SKELETON_NAME}>
      <DashboardPageHeader
        title="Settings"
        description="Manage your account preferences and security."
      />

      <div className="space-y-0">
        <section className="space-y-5 border-b border-border pb-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update your basic account information.
            </p>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <LoadingSkeleton className="h-14 w-14 rounded-full" />
              <div>
                <p className="text-small text-muted-foreground">Avatar</p>
                <div className="mt-1 flex gap-2">
                  <LoadingSkeleton className="h-9 w-32 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-24 rounded-md" />
                <LoadingSkeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <LoadingSkeleton className="h-4 w-24 rounded-md" />
                <LoadingSkeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        </section>

        <section className="space-y-5 border-b border-border pb-6 pt-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p className="text-sm text-muted-foreground">
              Manage your password and login security.
            </p>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <LoadingSkeleton className="h-4 w-24 rounded-md" />
              <LoadingSkeleton className="h-4 w-full max-w-md rounded-md" />
              <LoadingSkeleton className="h-4 w-48 rounded-md" />
            </div>
          </div>
          <LoadingSkeleton className="h-9 w-36 rounded-xl" />
        </section>

        <section className="space-y-5 border-b border-border pb-6 pt-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Control which emails and alerts you receive.
            </p>
          </div>
          <LoadingSkeleton className="h-4 w-64 rounded-md" />
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-3">
                <div className="space-y-1.5">
                  <LoadingSkeleton className="h-4 w-32 rounded-md" />
                  <LoadingSkeleton className="h-4 w-64 rounded-md" />
                </div>
                <LoadingSkeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 border-b border-border pb-6 pt-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Customize how Krukraft looks and behaves for you.
            </p>
          </div>
          <div className="space-y-4">
            <PreviewSettingsRow
              label="Theme"
              hint="Switch between light, dark, or system theme."
            />
            <PreviewSettingsRow
              label="Currency"
              hint="Used for displaying prices in the interface."
            />
            <PreviewSettingsRow
              label="Timezone"
              hint="Future features will use this timezone for schedules and history."
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <LoadingSkeleton className="h-4 w-28 rounded-md" />
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        </section>

        <div className="pt-6">
          <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete your account</p>
              <p className="mt-1 max-w-md text-small text-muted-foreground">
              Permanently remove your account and all associated data.
              </p>
            </div>
            <LoadingSkeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardPageSkeletonShell>
  );
}

export function SettingsPageSkeletonBonesPreview() {
  return (
    <Skeleton
      name={SETTINGS_PAGE_SKELETON_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <SettingsPagePreview />
    </Skeleton>
  );
}

export function SettingsPageSkeleton() {
  return <ManualSettingsPageSkeleton />;
}

function SettingsRouteShellPreview() {
  return (
    <DashboardPageStack>
      <DashboardPageHeaderSkeleton titleWidth="w-32" descriptionWidth="w-72" />
    </DashboardPageStack>
  );
}

export function SettingsRouteShellSkeleton() {
  return dashboardRuntimeShell(
    <SettingsRouteShellPreview />,
    "dashboard-settings",
    { width: "narrow" },
  );
}
