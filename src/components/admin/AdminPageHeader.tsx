import * as React from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: React.ReactNode;
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
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b border-border pb-4 sm:items-end">
      <div className="min-w-0">
        <p className="font-ui text-caption text-muted-foreground">Admin</p>
        <h1 className="mt-1 font-display text-h2 font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-small text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
