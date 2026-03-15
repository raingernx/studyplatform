"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, description, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <div className="text-[12px] font-medium text-text-secondary">{label}</div>}
      {description && <p className="text-[11px] text-text-tertiary">{description}</p>}
      <div>{children}</div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

