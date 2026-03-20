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
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-muted",
          variant === "hero"
            ? "left-3.5 h-4 w-4 sm:left-4 sm:h-5 sm:w-5"
            : "left-4 h-4 w-4",
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
            "absolute top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary",
            variant === "hero"
              ? "right-3 rounded-full p-1 sm:right-4"
              : "right-4",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null;

    const loadingIndicator = loading ? (
      <Loader2
        className={cn(
          "absolute top-1/2 -translate-y-1/2 animate-spin text-text-muted",
          variant === "hero" ? "right-3 h-4 w-4 sm:right-4 sm:h-5 sm:w-5" : "right-4 h-4 w-4",
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
                  "w-full rounded-xl border border-surface-200 bg-white sm:rounded-2xl",
                  "py-3 pl-11 pr-11 text-sm text-text-primary sm:py-4 sm:pl-12 sm:pr-12 sm:text-base",
                  "shadow-card-md placeholder:text-text-muted",
                  "outline-none transition-all duration-150",
                  "focus:border-brand-400 focus:shadow-card-lg focus:ring-3 focus:ring-brand-500/15",
                ]
              : [
                  "w-full rounded-xl border border-border-subtle bg-white px-11 py-3 text-sm",
                  "text-text-primary placeholder:text-text-muted shadow-sm outline-none transition",
                  "focus:ring-2 focus:ring-brand-500",
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
