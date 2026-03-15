"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function FormLabel({ className, ...props }: FormLabelProps) {
  return (
    <label
      className={cn("text-[12px] font-medium text-text-secondary flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

