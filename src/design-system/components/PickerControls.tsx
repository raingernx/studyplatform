"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "../primitives";

export interface PickerActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PickerActions({ className, ...props }: PickerActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
  );
}

export type PickerActionTone = "default" | "danger" | "muted";
export type PickerActionStyle = "outline" | "dashed";

const pickerActionToneClasses: Record<PickerActionTone, string> = {
  default: "text-muted-foreground hover:text-brand-600",
  danger: "text-danger-600 hover:text-danger-700 hover:border-danger-300 hover:bg-danger-50",
  muted: "text-muted-foreground hover:text-foreground",
};

export interface PickerActionButtonProps extends ButtonProps {
  tone?: PickerActionTone;
  actionStyle?: PickerActionStyle;
}

export function PickerActionButton({
  className,
  tone = "default",
  actionStyle = "outline",
  variant,
  size,
  children,
  ...props
}: PickerActionButtonProps) {
  return (
    <Button
      variant={variant ?? "outline"}
      size={size ?? "sm"}
      className={cn(
        "h-9 gap-1.5 px-4 text-caption",
        variant === "outline" || variant == null ? pickerActionToneClasses[tone] : null,
        actionStyle === "dashed" && "border-dashed",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export type PickerIconTone = "default" | "danger" | "info";

const pickerIconToneClasses: Record<PickerIconTone, string> = {
  default: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "text-muted-foreground hover:bg-red-50 hover:text-red-500",
  info: "text-blue-400 hover:bg-blue-100 hover:text-blue-600",
};

export interface PickerIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: PickerIconTone;
}

export function PickerIconButton({
  className,
  tone = "default",
  type = "button",
  ...props
}: PickerIconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "shrink-0 rounded-lg p-1.5 transition disabled:pointer-events-none disabled:opacity-50",
        pickerIconToneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

export type PreviewCardTone = "neutral" | "info";

const previewCardToneClasses: Record<PreviewCardTone, string> = {
  neutral: "border-border bg-muted",
  info: "border-blue-100 bg-blue-50",
};

export interface PreviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: PreviewCardTone;
}

export function PreviewCard({
  className,
  tone = "neutral",
  ...props
}: PreviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        previewCardToneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

export interface MediaPreviewProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MediaPreview({ className, ...props }: MediaPreviewProps) {
  return (
    <div
      className={cn(
        "relative inline-block overflow-hidden rounded-lg border border-border bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export interface PickerDropzoneShellProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  reject?: boolean;
  disabled?: boolean;
}

export function PickerDropzoneShell({
  className,
  active = false,
  reject = false,
  disabled = false,
  ...props
}: PickerDropzoneShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center text-small transition",
        reject
          ? "border-red-300"
          : active
            ? "border-brand-400 bg-muted"
            : "border-border bg-card",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-400 hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
