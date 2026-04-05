"use client";

import { Button } from "@/design-system";

export function DangerZone() {
  return (
    <div className="pt-6">
      <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Delete your account</p>
          <p className="mt-1 max-w-md text-small text-muted-foreground">
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
