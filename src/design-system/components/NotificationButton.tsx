import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NotificationButtonProps {
  count: number;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
}

export function NotificationButton({
  count,
  onClick,
  className,
  "aria-label": ariaLabel = "Notifications",
}: NotificationButtonProps) {
  const showBadge = count > 0;
  const displayCount = count > 9 ? "9+" : count;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-none transition-colors hover:bg-muted hover:text-foreground"
        aria-label={ariaLabel}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
      </button>

      {showBadge ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
          {displayCount}
        </span>
      ) : null}
    </div>
  );
}
