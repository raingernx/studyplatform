"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-xs",
        "space-y-4",
        className
      )}
    >
      {(title || description) && (
        <header className="space-y-1">
          {title && <h2 className="text-sm font-semibold text-text-primary">{title}</h2>}
          {description && (
            <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
          )}
        </header>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

