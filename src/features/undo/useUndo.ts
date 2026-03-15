"use client";

import { useCallback, useRef } from "react";

import { useNotifications } from "@/features/notifications/useNotifications";

interface ScheduleUndoOptions {
  label: string;
  timeoutMs?: number;
  perform: () => Promise<void> | void;
  onUndo?: () => void;
}

export function useUndo() {
  const { notify, remove } = useNotifications();
  const pendingRef = useRef<
    Record<
      string,
      {
        timeoutId: number;
        cancelled: boolean;
      }
    >
  >({});

  const scheduleUndo = useCallback(
    ({ label, timeoutMs = 5000, perform, onUndo }: ScheduleUndoOptions) => {
      const id = `undo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      pendingRef.current[id] = {
        timeoutId: window.setTimeout(async () => {
          const pending = pendingRef.current[id];
          if (!pending || pending.cancelled) return;
          try {
            await perform();
          } finally {
            delete pendingRef.current[id];
          }
        }, timeoutMs),
        cancelled: false,
      };

      const notificationId = notify("warning", label, undefined, {
        actionLabel: "Undo",
        onAction: () => {
          const pending = pendingRef.current[id];
          if (!pending) return;
          pending.cancelled = true;
          window.clearTimeout(pending.timeoutId);
          delete pendingRef.current[id];
          if (onUndo) onUndo();
          remove(notificationId);
        },
      });

      return id;
    },
    [notify, remove],
  );

  return { scheduleUndo };
}

