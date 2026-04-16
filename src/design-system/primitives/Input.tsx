import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, "prefix"> {
  leftAdornment?: React.ReactNode
  rightAdornment?: React.ReactNode
  error?: string
  hint?: string
  hintClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({
  error,
  hint,
  hintClassName,
  id,
  className,
  leftAdornment,
  rightAdornment,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}, ref) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [ariaDescribedBy, error ? errorId : null, !error && hint ? hintId : null]
    .filter(Boolean)
    .join(" ") || undefined

  return (
    <div className="w-full space-y-1">
      {leftAdornment || rightAdornment ? (
        <div className="relative">
          {leftAdornment ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-muted-foreground">
              {leftAdornment}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            data-slot="input"
            className={cn(
              "input-base min-w-0",
              "aria-invalid:border-danger-600 aria-invalid:ring-2 aria-invalid:ring-danger-600/20",
              leftAdornment && "pl-11",
              rightAdornment && "pr-11",
              className,
            )}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid ?? Boolean(error)}
            {...props}
          />
          {rightAdornment ? (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground">
              {rightAdornment}
            </span>
          ) : null}
        </div>
      ) : (
        <input
          ref={ref}
          id={inputId}
          data-slot="input"
          className={cn(
            "input-base min-w-0",
            "aria-invalid:border-danger-600 aria-invalid:ring-2 aria-invalid:ring-danger-600/20",
            className,
          )}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          {...props}
        />
      )}
      {error ? (
        <p id={errorId} className="text-caption text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={cn("text-caption text-muted-foreground", hintClassName)}>
          {hint}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = "Input"

export { Input }
