"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import { Button } from "@/design-system/primitives/Button";
import { cn } from "@/lib/utils";

export type ConfirmVariant = "danger" | "warning" | "info";

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
  }
> = {
  danger: {
    icon: AlertCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
};

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ConfirmVariant;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  variant = "danger",
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  destructive = true,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const [internalLoading, setInternalLoading] = React.useState(false);
  const isBusy = loading || internalLoading;

  async function handleConfirm() {
    setInternalLoading(true);
    try {
      await Promise.resolve(onConfirm());
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card-lg outline-none sm:max-w-md",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "duration-150",
          )}
        >
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  config.iconBg,
                  config.iconColor,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="font-display text-base font-semibold text-foreground">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/60 px-5 py-3">
            <DialogPrimitive.Close asChild>
              <Button variant="outline" disabled={isBusy}>
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant={variant === "danger" && destructive ? "danger" : "primary"}
              onClick={handleConfirm}
              disabled={isBusy}
            >
              {isBusy ? "Loading..." : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
