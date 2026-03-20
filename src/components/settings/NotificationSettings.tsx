"use client";

import { useState } from "react";
import { useTransition } from "react";
import { Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/design-system";
import { Switch } from "@/design-system";

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

function ToggleRow({ label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-zinc-900">{label}</p>
        <p className="mt-0.5 text-[12px] text-zinc-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

type NotificationSettingsProps = {
  emailNotifications: boolean;
  purchaseReceipts: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
};

export function NotificationSettings({
  emailNotifications: initialEmail,
  purchaseReceipts: initialReceipts,
  productUpdates: initialUpdates,
  marketingEmails: initialMarketing,
}: NotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(initialEmail);
  const [purchaseReceipts, setPurchaseReceipts] = useState(initialReceipts);
  const [productUpdates, setProductUpdates] = useState(initialUpdates);
  const [marketingEmails, setMarketingEmails] = useState(initialMarketing);
  const [, startTransition] = useTransition();

  function patch(partial: Partial<NotificationSettingsProps>) {
    startTransition(() => {
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      }).catch(() => {
        // Swallow errors for now; UI state already updated optimistically.
      });
    });
  }

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Control which emails and alerts you receive.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 text-[12px] text-zinc-600">
          <Bell className="h-3.5 w-3.5 text-zinc-400" />
          Notification preferences are stored locally for now.
        </div>
        <div className="mt-3 divide-y divide-zinc-100">
          <ToggleRow
            label="Email notifications"
            description="General account and service updates."
            checked={emailNotifications}
            onCheckedChange={(next) => {
              setEmailNotifications(next);
              patch({ emailNotifications: next });
            }}
          />
          <ToggleRow
            label="Purchase receipts"
            description="Receive receipts when you buy resources."
            checked={purchaseReceipts}
            onCheckedChange={(next) => {
              setPurchaseReceipts(next);
              patch({ purchaseReceipts: next });
            }}
          />
          <ToggleRow
            label="Product updates"
            description="Major new features and improvements."
            checked={productUpdates}
            onCheckedChange={(next) => {
              setProductUpdates(next);
              patch({ productUpdates: next });
            }}
          />
          <ToggleRow
            label="Marketing emails"
            description="Occasional tips, offers, and curated content."
            checked={marketingEmails}
            onCheckedChange={(next) => {
              setMarketingEmails(next);
              patch({ marketingEmails: next });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
