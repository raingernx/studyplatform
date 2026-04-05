"use client";

import { useState } from "react";
import { NotificationButton } from "@/design-system";
import { useNotifications } from "./useNotifications";

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const hasUnread = unreadCount > 0;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && hasUnread) {
      markAllAsRead();
    }
  }

  return (
    <div className="relative inline-block">
      <NotificationButton count={unreadCount} onClick={toggle} />
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-card-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-tightest text-muted-foreground">
            <span>Notifications</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              {notifications.length === 0
                ? "No notifications"
                : `${notifications.length} total`}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-muted-foreground">
                You're all caught up.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 px-3 py-2 text-[12px] hover:bg-muted"
                >
                  <span
                    className={[
                      "mt-0.5 text-xs",
                      n.type === "success"
                        ? "text-emerald-600"
                        : n.type === "warning"
                          ? "text-amber-600"
                          : n.type === "error"
                            ? "text-red-600"
                            : "text-blue-600",
                    ].join(" ")}
                  >
                    {n.type === "success"
                      ? "✓"
                      : n.type === "warning"
                        ? "⚠"
                        : n.type === "error"
                          ? "⨯"
                          : "ℹ"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-foreground">
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {n.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
