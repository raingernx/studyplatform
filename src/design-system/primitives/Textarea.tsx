import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  error,
  hint,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}, ref) {
  const generatedId = React.useId()
  const textareaId = id ?? generatedId
  const hintId = `${textareaId}-hint`
  const errorId = `${textareaId}-error`
  const describedBy =
    [ariaDescribedBy, error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div className="w-full space-y-1">
      <textarea
        ref={ref}
        id={textareaId}
        data-slot="textarea"
        className={cn(
          "input-base min-h-[120px] resize-y py-2.5",
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

Textarea.displayName = "Textarea"

export { Textarea }
