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
  title = "Admin workspace",
  subtitle = "Operations",
  children,
  onMenuToggle,
}: TopbarProps & { onMenuToggle?: () => void }) {
  return (
    <SharedDashboardTopbar
      variant="admin"
      onMenuToggle={onMenuToggle}
      left={
        <div className="min-w-0">
          <p className="font-ui text-caption text-muted-foreground">
            {title}
          </p>
          <p className="truncate text-small font-medium text-foreground">
            {subtitle}
          </p>
        </div>
      }
      rightClassName="gap-3"
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
