"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Notification, NotificationType } from "@/features/admin-ux/types";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  notify: (
    type: NotificationType,
    message: string,
    description?: string,
    options?: { actionLabel?: string; onAction?: () => void },
  ) => string;
  addNotification: (
    type: NotificationType,
    message: string,
    description?: string,
    options?: { actionLabel?: string; onAction?: () => void },
  ) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  remove: (id: string) => void;
}

const NotificationsContext =
  createContext<NotificationsContextValue | undefined>(undefined);

let notificationIdCounter = 0;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback(
    (
      type: NotificationType,
      message: string,
      description?: string,
      options?: { actionLabel?: string; onAction?: () => void },
    ): string => {
      const id = `notif_${++notificationIdCounter}`;
      const timestamp = new Date();
      const entry: Notification = {
        id,
        type,
        message,
        description,
        timestamp,
        read: false,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      };

      setNotifications((prev) => [entry, ...prev].slice(0, 50));
      return id;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      notify,
      addNotification: notify,
      markAsRead,
      markAllAsRead,
      clear,
      remove,
    }),
    [notifications, unreadCount, notify, markAsRead, markAllAsRead, clear, remove],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
