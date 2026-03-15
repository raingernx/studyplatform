import type { ReactNode } from "react";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { AdminGlobalSearch } from "./AdminGlobalSearch";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  /** Optional: search input, actions, user pill */
  children?: ReactNode;
}

/** Top bar for admin / dashboard. Optional search and actions. */
export function Topbar({ title = "Admin", subtitle = "Control panel", children }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-white px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
          {title}
        </p>
        <p className="text-sm font-semibold text-text-primary">{subtitle}</p>
      </div>
      {children ?? (
        <div className="flex items-center gap-4">
          <AdminGlobalSearch />
          <NotificationBell />
        </div>
      )}
    </header>
  );
}
