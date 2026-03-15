import type { ReactNode } from "react";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { AdminGlobalSearch } from "./AdminGlobalSearch";
import { DashboardTopbar as SharedDashboardTopbar } from "@/components/layout/dashboard/DashboardTopbar";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  /** Optional: search input, actions, user pill */
  children?: ReactNode;
}

/** Top bar for admin / dashboard. Optional search and actions. */
export function Topbar({
  title = "Admin",
  subtitle = "Control panel",
  children,
  onMenuToggle,
}: TopbarProps & { onMenuToggle?: () => void }) {
  return (
    <SharedDashboardTopbar
      variant="admin"
      onMenuToggle={onMenuToggle}
      left={
        <div>
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">
            {title}
          </p>
          <p className="text-sm font-semibold text-text-primary">{subtitle}</p>
        </div>
      }
      rightClassName="gap-4"
      right={
        children ?? (
          <>
            <AdminGlobalSearch />
            <NotificationBell />
          </>
        )
      }
    />
  );
}
