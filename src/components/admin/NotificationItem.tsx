"use client";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";

import type { Notification } from "@/features/admin-ux/types";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const { id, type, message, description, actionLabel, onAction } = notification;

  const iconConfig =
    type === "success"
      ? {
          Icon: CheckCircle2,
          wrapperClass: "bg-emerald-50 text-emerald-600",
        }
      : type === "error"
        ? {
            Icon: AlertCircle,
            wrapperClass: "bg-red-50 text-red-600",
          }
        : {
            Icon: Info,
            wrapperClass: "bg-primary-50 text-primary-600",
          };

  const Icon = iconConfig.Icon;

  return (
    <div className="pointer-events-auto relative flex min-w-[260px] max-w-[340px] animate-fade-up items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 motion-reduce:animate-none">
      <div
        className={[
          "flex h-8 w-8 items-center justify-center rounded-full text-xs",
          iconConfig.wrapperClass,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-1 flex-col gap-1 pr-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium leading-snug text-foreground">
              {message}
            </p>
            {description && (
              <p className="mt-0.5 text-caption leading-snug text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={() => {
                onAction();
                onDismiss(id);
              }}
              className="shrink-0 font-ui text-caption font-medium text-primary-700 hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="absolute right-2 top-[13px] flex h-7 w-7 items-center justify-center rounded-full pb-0.5 text-[14px] text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center text-[24px] leading-none">
          ×
        </span>
      </button>
    </div>
  );
}
