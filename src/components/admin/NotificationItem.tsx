"use client";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

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
            wrapperClass: "bg-blue-50 text-blue-600",
          };

  const Icon = iconConfig.Icon;

  // #region agent log
  fetch("http://127.0.0.1:7472/ingest/8f36f62e-5ee6-48fc-ac11-6d3f136199e5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "b78fc7",
    },
    body: JSON.stringify({
      sessionId: "b78fc7",
      runId: "notifications-pre-fix-remake",
      hypothesisId: "H_admin_toast_layout",
      location: "NotificationItem.tsx:80",
      message: "Admin NotificationItem rendered",
      data: { type, hasAction: Boolean(actionLabel) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-auto relative flex min-w-[260px] max-w-[340px] items-center gap-3 rounded-xl border border-border-subtle/80 bg-white px-4 py-3 text-xs shadow-card-lg"
    >
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
            <p className="text-[13px] font-medium leading-snug text-text-primary">
              {message}
            </p>
            {description && (
              <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">
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
              className="shrink-0 text-[11px] font-medium text-blue-600 hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="absolute right-2 top-[13px] flex h-7 w-7 items-center justify-center rounded-full pb-0.5 text-[14px] text-text-muted hover:bg-surface-100 hover:text-text-secondary"
        aria-label="Dismiss notification"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center text-[24px] leading-none">
          ×
        </span>
      </button>
    </motion.div>
  );
}

