import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, "prefix"> {
  /** Optional left icon/element rendered inside the input */
  leftAdornment?: React.ReactNode;
  /** Optional right element (clear button, unit label, etc.) */
  rightAdornment?: React.ReactNode;
}

/**
 * PaperDock Input — h-10, rounded-lg, brand-500 focus ring.
 * Wrap in a `<label>` or use `htmlFor` on an adjacent `<label>` for accessibility.
 */
function Input({ className, type, leftAdornment, rightAdornment, ...props }: InputProps) {
  if (leftAdornment || rightAdornment) {
    return (
      <div className="relative flex items-center">
        {leftAdornment && (
          <span className="pointer-events-none absolute left-3 flex items-center text-text-muted">
            {leftAdornment}
          </span>
        )}
        <input
          type={type}
          data-slot="input"
          className={cn(
            "h-10 w-full min-w-0 rounded-lg border border-surface-200 bg-white",
            "px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
            "transition-colors outline-none",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-60",
            "aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20",
            leftAdornment  && "pl-9",
            rightAdornment && "pr-9",
            className
          )}
          {...props}
        />
        {rightAdornment && (
          <span className="pointer-events-none absolute right-3 flex items-center text-text-muted">
            {rightAdornment}
          </span>
        )}
      </div>
    )
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-surface-200 bg-white",
        "px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
        "transition-colors outline-none",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
        "disabled:cursor-not-allowed disabled:bg-surface-50 disabled:opacity-60",
        "aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
