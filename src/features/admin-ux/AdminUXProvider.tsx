"use client";

import type { ReactNode } from "react";

import { NotificationsProvider } from "@/features/notifications/useNotifications";
import { UploadManagerProvider } from "@/features/uploads/useUploadManager";
import { ToastProvider } from "@/components/ui/toast-provider";

interface AdminUXProviderProps {
  children: ReactNode;
}

/**
 * AdminUXProvider
 *
 * Composes all admin UX feature providers (undo, jobs, uploads, notifications, activity)
 * together with the shared ToastProvider. For now it only wraps ToastProvider, but it
 * is the single place where future providers will be added.
 */
export function AdminUXProvider({ children }: AdminUXProviderProps) {
  return (
    <NotificationsProvider>
      <UploadManagerProvider>
        <ToastProvider>{children}</ToastProvider>
      </UploadManagerProvider>
    </NotificationsProvider>
  );
}

