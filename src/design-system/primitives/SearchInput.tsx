"use client";

import * as React from "react";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchInputVariant = "default" | "hero";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: SearchInputVariant;
  loading?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  containerClassName?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  submitButton?: React.ReactNode;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      variant = "default",
      type = "search",
      loading = false,
      onClear,
      clearLabel = "Clear search",
      className,
      containerClassName,
      startAdornment,
      endAdornment,
      submitButton,
      value,
      ...props
    },
    ref,
  ) => {
    const hasValue =
      typeof value === "string"
        ? value.length > 0
        : typeof value === "number"
          ? true
          : false;

    const searchIcon = startAdornment ?? (
      <Search
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 text-muted-foreground",
          variant === "hero"
            ? "h-full w-12 p-4 sm:w-14 sm:p-[18px]"
            : "h-full w-11 p-3.5",
        )}
        aria-hidden
      />
    );

    const clearButton =
      !loading && onClear && hasValue ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className={cn(
            "absolute inset-y-0 right-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2",
            variant === "hero"
              ? "w-12 rounded-full p-4 sm:w-14 sm:p-[18px]"
              : "w-11 p-3.5",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null;

    const loadingIndicator = loading ? (
      <Loader2
        className={cn(
          "absolute inset-y-0 right-0 animate-spin text-muted-foreground",
          variant === "hero"
            ? "h-full w-12 p-4 sm:w-14 sm:p-[18px]"
            : "h-full w-11 p-3.5",
        )}
      />
    ) : null;

    const trailingAdornment = loadingIndicator ?? clearButton ?? endAdornment;

    const input = (
      <div className={cn("relative w-full", containerClassName)}>
        {searchIcon}
        <input
          ref={ref}
          type={type}
          value={value}
          className={cn(
            variant === "hero"
              ? [
                  "w-full rounded-2xl border border-input bg-background",
                  "py-3.5 pl-12 pr-12 text-sm text-foreground sm:py-4 sm:pl-14 sm:pr-14 sm:text-base",
                  "placeholder:text-muted-foreground",
                  "outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-70",
                  "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15",
                  "focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/15",
                ]
              : [
                  "w-full rounded-xl border border-input bg-background py-2.5 pl-11 pr-11 text-sm",
                  "text-foreground placeholder:text-muted-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                  "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15",
                  "focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/15",
                ],
            className,
          )}
          {...props}
        />
        {trailingAdornment}
      </div>
    );

    if (!submitButton) {
      return input;
    }

    return (
      <div className="flex w-full items-stretch gap-3">
        {input}
        {submitButton}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
