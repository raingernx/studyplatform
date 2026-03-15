"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Admin form section: rounded-xl border, p-6, space-y-6.
 * Structure: Title, optional Description, then Children.
 */
export function FormSection({
  title,
  description,
  className,
  children,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 space-y-6",
        className
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
