import * as React from "react"

import { Input as UIInput, type InputProps as UIInputProps } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

export interface InputProps extends UIInputProps {
  error?: string
  hint?: string
}

function Input({
  error,
  hint,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [ariaDescribedBy, error ? errorId : null, !error && hint ? hintId : null]
    .filter(Boolean)
    .join(" ") || undefined

  return (
    <div className="w-full space-y-1">
      <UIInput
        id={inputId}
        className={className}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? Boolean(error)}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={cn("text-xs text-text-muted")}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

Input.displayName = "Input"

export { Input }
