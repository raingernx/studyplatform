"use client";

import { Button } from "@/components/ui/Button";

export function DangerZone() {
  return (
    <div className="mb-8">
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-6">
        <div>
          <p className="text-[13px] font-medium text-zinc-900">Delete your account</p>
          <p className="mt-1 max-w-md text-[12px] text-zinc-500">
            All your data will be permanently removed.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button variant="destructive" size="sm" disabled>
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}

