"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FormActionsProps = React.HTMLAttributes<HTMLDivElement>;

export function FormActions({ className, ...props }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 pt-4 border-t border-surface-100",
        "sm:flex-row sm:items-center sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

