"use client";

import * as React from "react";

import { Button, type ButtonProps } from "@/design-system/primitives";
import { cn } from "@/lib/utils";

export type RowActionTone = "default" | "danger" | "success" | "muted";

export interface RowActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RowActions({ className, ...props }: RowActionsProps) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

export interface RowActionButtonProps extends ButtonProps {
  iconOnly?: boolean;
  tone?: RowActionTone;
}

const toneClasses: Record<RowActionTone, string> = {
  default: "border-border text-foreground hover:bg-muted",
  danger:
    "border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700",
  muted:
    "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
};

export function RowActionButton({
  className,
  variant,
  size,
  iconOnly = false,
  tone = "default",
  children,
  ...props
}: RowActionButtonProps) {
  return (
    <Button
      variant={variant ?? "outline"}
      size={size ?? "sm"}
      className={cn(
        "h-8 gap-1.5 px-2.5 text-xs",
        iconOnly && "w-8 px-0",
        variant === "outline" || variant == null ? toneClasses[tone] : null,
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export interface RowActionMenuTriggerProps extends Omit<RowActionButtonProps, "iconOnly"> {
  "aria-label"?: string;
}

export function RowActionMenuTrigger({
  children,
  className,
  "aria-label": ariaLabel = "More actions",
  ...props
}: RowActionMenuTriggerProps) {
  return (
    <RowActionButton
      iconOnly
      aria-label={ariaLabel}
      className={className}
      {...props}
    >
      {children}
    </RowActionButton>
  );
}
