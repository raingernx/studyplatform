"use client";

import { AnimatePresence } from "framer-motion";

import { useNotifications } from "@/features/notifications/useNotifications";
import { NotificationItem } from "./NotificationItem";

const MAX_VISIBLE = 4;

export function NotificationStack() {
  const { notifications, remove } = useNotifications();

  if (!notifications.length) return null;

  const visible = notifications.slice(0, MAX_VISIBLE);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence initial={false}>
        {visible.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={remove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

