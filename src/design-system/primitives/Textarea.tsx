import * as React from "react";

import { Textarea as UITextarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
}

function Textarea({
  error,
  hint,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;
  const describedBy =
    [ariaDescribedBy, error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="w-full space-y-1">
      <UITextarea
        id={textareaId}
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
  );
}

Textarea.displayName = "Textarea";

export { Textarea };
