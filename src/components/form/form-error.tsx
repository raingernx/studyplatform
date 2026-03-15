"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FormErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

export function FormError({ className, ...props }: FormErrorProps) {
  if (!props.children) return null;

  return (
    <p
      className={cn(
        "text-[11px] text-red-600 leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

