"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-[12px] font-medium text-text-secondary",
        "flex items-center gap-1.5",
        className
      )}
      {...props}
    />
  );
}

