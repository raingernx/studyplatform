import * as React from "react";

import { Select as UISelect } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  hint?: string;
}

function Select({
  error,
  hint,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy =
    [ariaDescribedBy, error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="w-full space-y-1">
      <UISelect
        id={selectId}
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

Select.displayName = "Select";

export { Select };
