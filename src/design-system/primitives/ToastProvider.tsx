"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface Toast {
  id: string;
  title: string;
  type: ToastType;
  duration: number | "persistent";
}

type ToastInput = Pick<Toast, "title" | "type"> & { duration?: number | "persistent" };

interface ToastContextValue {
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
}

const DEFAULT_DURATION: Record<ToastType, number | "persistent"> = {
  success: 6000,
  info: 6000,
  warning: "persistent",
  error: "persistent",
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let idCounter = 0;
function nextId() {
  return `toast_${++idCounter}`;
}

const EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { exiting?: boolean })[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    setToasts((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (!item || item.exiting) return prev;
      return prev.map((entry) => (entry.id === id ? { ...entry, exiting: true } : entry));
    });

    const removeAfterExit = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, EXIT_MS);

    timeoutsRef.current.set(`exit_${id}`, removeAfterExit);
    setTimeout(() => {
      timeoutsRef.current.delete(`exit_${id}`);
    }, EXIT_MS + 50);
  }, []);

  const addToast = useCallback((input: ToastInput) => {
    const id = nextId();
    const duration = input.duration ?? DEFAULT_DURATION[input.type];
    const toast: Toast & { exiting?: boolean } = {
      id,
      title: input.title,
      type: input.type,
      duration,
    };

    setToasts((prev) => {
      const next = input.type === "success" ? prev.filter((entry) => entry.type !== "success") : prev;
      return [toast, ...next];
    });

    if (duration !== "persistent" && typeof duration === "number") {
      const timeout = setTimeout(() => removeToast(id), duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastList toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: (Toast & { exiting?: boolean })[];
  onDismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const ICON: Record<ToastType, string> = {
  success: "✓",
  info: "ℹ",
  warning: "⚠",
  error: "⨯",
};

const ICON_CLASS: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-600",
  info: "border-blue-200 bg-blue-50 text-blue-600",
  warning: "border-amber-200 bg-amber-50 text-amber-600",
  error: "border-red-200 bg-red-50 text-red-600",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast & { exiting?: boolean };
  onDismiss: (id: string) => void;
}) {
  const { id, title, type, exiting } = toast;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg transition-opacity duration-200 ${
        exiting ? "opacity-0" : "animate-[fade-up_0.25s_var(--ease-out)] opacity-100"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-caption ${ICON_CLASS[type]}`}
      >
        {ICON[type]}
      </div>
      <p className="min-w-0 flex-1 text-small text-foreground">{title}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-70 text-muted-foreground transition-opacity hover:bg-muted hover:opacity-100"
        aria-label="Dismiss"
      >
        <span className="h-4 w-4 text-center text-sm leading-none">✕</span>
      </button>
    </div>
  );
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
