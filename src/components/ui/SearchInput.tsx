"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** PaperDock Design System: search input — rounded-full, pl-10 for icon. */
export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden
      />
      <input
        type="search"
        className={cn(
          "input-base h-10 w-full rounded-full pl-10 pr-4",
          "border border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          className
        )}
        {...props}
      />
    </div>
  );
}
