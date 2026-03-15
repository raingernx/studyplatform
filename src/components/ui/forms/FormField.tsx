"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  /** Optional id for the control; when set, label uses htmlFor for accessibility */
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Admin form field: Label, input/field, optional helper text, optional error.
 * Spacing: space-y-2.
 */
export function FormField({
  label,
  description,
  error,
  id,
  className,
  children,
}: FormFieldProps) {
  const LabelWrap = id ? "label" : "div";
  return (
    <div className={cn("space-y-2", className)}>
      {label != null && label !== "" && (
        <LabelWrap
          {...(id ? { htmlFor: id } : {})}
          className="block text-sm font-medium text-zinc-700"
        >
          {label}
        </LabelWrap>
      )}
      {children}
      {description != null && description !== "" && (
        <p className="text-xs text-zinc-500">{description}</p>
      )}
      {error != null && error !== "" && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
