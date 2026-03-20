import * as React from "react";

import { cn } from "@/lib/utils";

export interface PaginationNavProps extends React.ComponentProps<"nav"> {}

export function PaginationNav({ className, ...props }: PaginationNavProps) {
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
      {...props}
    />
  );
}

export interface PaginationListProps extends React.ComponentProps<"div"> {}

export function PaginationList({ className, ...props }: PaginationListProps) {
  return <div className={cn("flex items-center justify-center gap-1", className)} {...props} />;
}

export interface PaginationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: "sm" | "md";
}

export function PaginationButton({
  className,
  active = false,
  size = "md",
  type = "button",
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1 border font-medium transition-colors",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm"
          ? "rounded-md px-3 py-1.5 text-sm"
          : "min-w-[36px] rounded-lg px-3 py-2 text-sm",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-surface-200 bg-white text-text-secondary hover:border-brand-300 hover:bg-surface-50 hover:text-brand-600",
        className,
      )}
      {...props}
    />
  );
}

export interface PaginationInfoProps extends React.ComponentProps<"span"> {}

export function PaginationInfo({ className, ...props }: PaginationInfoProps) {
  return <span className={cn("text-sm text-text-muted", className)} {...props} />;
}

export interface PaginationEllipsisProps extends React.ComponentProps<"span"> {}

export function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("select-none px-1 text-sm text-text-muted", className)}
      {...props}
    >
      …
    </span>
  );
}

export function buildPaginationItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: (number | "…")[] = [1];

  if (current > 3) {
    items.push("…");
  }

  for (
    let page = Math.max(2, current - 1);
    page <= Math.min(total - 1, current + 1);
    page += 1
  ) {
    items.push(page);
  }

  if (current < total - 2) {
    items.push("…");
  }

  items.push(total);

  return items;
}
