import * as React from "react"

import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  hint?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({
  error,
  hint,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}, ref) {
  const generatedId = React.useId()
  const selectId = id ?? generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`
  const describedBy =
    [ariaDescribedBy, error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div className="w-full space-y-1">
      <select
        ref={ref}
        id={selectId}
        data-slot="select"
        className={cn(
          "select-base",
          "aria-invalid:border-danger-600 aria-invalid:ring-2 aria-invalid:ring-danger-600/20",
          className,
        )}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? Boolean(error)}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-caption text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={cn("text-caption text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </div>
  )
})

Select.displayName = "Select"

export { Select }
