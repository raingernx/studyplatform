"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { FormSection, Switch } from "@/design-system";

type ToggleRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  meta?: string | null;
  onCheckedChange: (next: boolean) => void;
};

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled = false,
  meta = null,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-small text-muted-foreground">{description}</p>
        {meta ? (
          <p
            id={`${id}-status`}
            className="text-caption font-medium text-primary-700"
            aria-live="polite"
          >
            {meta}
          </p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-describedby={meta ? `${id}-status` : undefined}
        onCheckedChange={onCheckedChange}
      />
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
  type PreferenceKey = keyof NotificationSettingsProps;

  const [emailNotifications, setEmailNotifications] = useState(initialEmail);
  const [purchaseReceipts, setPurchaseReceipts] = useState(initialReceipts);
  const [productUpdates, setProductUpdates] = useState(initialUpdates);
  const [marketingEmails, setMarketingEmails] = useState(initialMarketing);
  const [pendingKey, setPendingKey] = useState<PreferenceKey | null>(null);
  const [status, setStatus] = useState<{
    tone: "idle" | "saving" | "saved" | "error";
    message: string | null;
  }>({
    tone: "idle",
    message: null,
  });

  async function patch(key: PreferenceKey, partial: Partial<NotificationSettingsProps>) {
    setPendingKey(key);
    setStatus({
      tone: "saving",
      message: "Saving notification preferences…",
    });

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification preferences.");
      }

      setStatus({
        tone: "saved",
        message: "Notification preferences saved.",
      });
    } catch {
      setStatus({
        tone: "error",
        message: "Could not save your notification preferences. Try again.",
      });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <FormSection
      variant="flat"
      title="Notifications"
      description="Control which emails and alerts you receive."
      contentClassName="space-y-4"
    >
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
        Notification preferences are stored locally for now.
      </div>
      {status.message ? (
        <p
          className={[
            "text-caption font-medium",
            status.tone === "error" ? "text-danger-600" : "text-muted-foreground",
          ].join(" ")}
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
      <div className="divide-y divide-border">
        <ToggleRow
          id="email-notifications"
          label="Email notifications"
          description="General account and service updates."
          checked={emailNotifications}
          disabled={pendingKey !== null}
          meta={pendingKey === "emailNotifications" ? "Saving…" : null}
          onCheckedChange={(next) => {
            setEmailNotifications(next);
            void patch("emailNotifications", { emailNotifications: next });
          }}
        />
        <ToggleRow
          id="purchase-receipts"
          label="Purchase receipts"
          description="Receive receipts when you buy resources."
          checked={purchaseReceipts}
          disabled={pendingKey !== null}
          meta={pendingKey === "purchaseReceipts" ? "Saving…" : null}
          onCheckedChange={(next) => {
            setPurchaseReceipts(next);
            void patch("purchaseReceipts", { purchaseReceipts: next });
          }}
        />
        <ToggleRow
          id="product-updates"
          label="Product updates"
          description="Major new features and improvements."
          checked={productUpdates}
          disabled={pendingKey !== null}
          meta={pendingKey === "productUpdates" ? "Saving…" : null}
          onCheckedChange={(next) => {
            setProductUpdates(next);
            void patch("productUpdates", { productUpdates: next });
          }}
        />
        <ToggleRow
          id="marketing-emails"
          label="Marketing emails"
          description="Occasional tips, offers, and curated content."
          checked={marketingEmails}
          disabled={pendingKey !== null}
          meta={pendingKey === "marketingEmails" ? "Saving…" : null}
          onCheckedChange={(next) => {
            setMarketingEmails(next);
            void patch("marketingEmails", { marketingEmails: next });
          }}
        />
      </div>
    </FormSection>
  );
}
