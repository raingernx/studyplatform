"use client";

import { useCallback } from "react";
import { useToastContext, type ToastType } from "./ToastProvider";

export interface ToastOptions {
  type: ToastType;
  title: string;
  duration?: number | "persistent";
}

export type ToastFn = ((options: ToastOptions) => string) & {
  success: (title: string, duration?: number) => string;
  info: (title: string, duration?: number) => string;
  warning: (title: string) => string;
  error: (title: string) => string;
};

export function useToast(): { toast: ToastFn } {
  const { addToast } = useToastContext();

  const toast = useCallback(
    (options: ToastOptions) =>
      addToast({
        type: options.type,
        title: options.title,
        duration: options.duration,
      }),
    [addToast],
  ) as ToastFn;

  toast.success = (title: string, duration?: number) =>
    addToast({ type: "success", title, duration });
  toast.info = (title: string, duration?: number) =>
    addToast({ type: "info", title, duration });
  toast.warning = (title: string) =>
    addToast({ type: "warning", title });
  toast.error = (title: string) =>
    addToast({ type: "error", title });

  return { toast };
}
