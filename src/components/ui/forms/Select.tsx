"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const selectBase =
  "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-zinc-900 outline-none transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 appearance-none bg-no-repeat bg-[length_14px] bg-[right_0.75rem_center] disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60";

const selectBgImage =
  "url(\"data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%2371717a' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

export function Select({ className, style, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(selectBase, className)}
      style={{
        ...style,
        backgroundImage: selectBgImage,
        paddingRight: "2.25rem",
      }}
      {...props}
    >
      {children}
    </select>
  );
}
