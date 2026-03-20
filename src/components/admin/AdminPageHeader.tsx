import * as React from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Action buttons rendered on the right side of the header */
  actions?: React.ReactNode;
}

/**
 * Standardised admin page header.
 *
 * Matches the visual baseline of the Admin Resources page:
 * - border-b separator with pb-4
 * - items-end alignment so action buttons sit flush with the title baseline
 * - min-w-0 to prevent overflow in narrow containers
 */
export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-surface-200 pb-4">
      <div>
        <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-meta text-text-secondary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
