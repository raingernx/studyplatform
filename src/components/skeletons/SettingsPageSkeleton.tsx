"use client";

import { Skeleton } from "boneyard-js/react";
import { PageContentNarrow } from "@/design-system";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

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
    <PageContentNarrow className="space-y-8">
      <div className="space-y-3">
        <LoadingSkeleton className="h-8 w-32 rounded-md" />
        <LoadingSkeleton className="h-4 w-72 rounded-md" />
      </div>

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
    </PageContentNarrow>
  );
}

function PreviewSettingsSection({
  title,
  description,
  rows,
  footerLabel,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; hint: string; value: string }>;
  footerLabel?: string;
}) {
  return (
    <section className="space-y-5 border-b border-border pb-6 last:border-b-0 last:pb-0">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_240px] md:gap-6"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{row.label}</p>
              <p className="text-sm text-muted-foreground">{row.hint}</p>
            </div>
            <div className="flex h-11 w-full max-w-xs items-center rounded-xl border border-input bg-background px-4 text-sm text-foreground">
              {row.value}
            </div>
          </div>
        ))}
      </div>
      {footerLabel ? (
        <div className="inline-flex h-9 items-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground">
          {footerLabel}
        </div>
      ) : null}
    </section>
  );
}

function SettingsPagePreview() {
  return (
    <PageContentNarrow className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, notifications, and account preferences.
        </p>
      </div>

      <div className="space-y-0">
        <PreviewSettingsSection
          title="Profile"
          description="Update your public identity and contact details."
          rows={[
            { label: "Display name", hint: "Shown across marketplace and purchases.", value: "Kru Craft" },
            { label: "Email", hint: "Used for account updates and receipts.", value: "hello@krukraft.com" },
          ]}
          footerLabel="Save profile"
        />
        <PreviewSettingsSection
          title="Preferences"
          description="Choose defaults for language, theme, and reading comfort."
          rows={[
            { label: "Theme", hint: "Applied across app shell and dashboard.", value: "Light" },
          ]}
          footerLabel="Save preferences"
        />
        <PreviewSettingsSection
          title="Notifications"
          description="Decide which updates should reach you by email."
          rows={[
            { label: "New purchases", hint: "Receipt and confirmation emails.", value: "Enabled" },
            { label: "Membership updates", hint: "Renewals and plan reminders.", value: "Enabled" },
            { label: "Creator updates", hint: "Publishing and review alerts.", value: "Disabled" },
            { label: "Product news", hint: "Feature announcements and releases.", value: "Disabled" },
          ]}
        />
        <PreviewSettingsSection
          title="Security"
          description="Keep your account safe and up to date."
          rows={[
            { label: "Password", hint: "Use a strong password for sign-in.", value: "Last updated recently" },
            { label: "Connected provider", hint: "Google account currently linked.", value: "Google" },
            { label: "Session activity", hint: "Signed in on current device.", value: "This browser" },
          ]}
          footerLabel="Review security"
        />
        <div className="pt-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Permanently remove your account and all associated data.
            </p>
          </div>
        </div>
      </div>
    </PageContentNarrow>
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
