"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/design-system";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  variant?: "flat" | "card";
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  variant = "flat",
  children,
}: FormSectionProps) {
  if (variant === "flat") {
    return (
      <section
        className={cn(
          "space-y-5 border-b border-border pb-6 last:border-b-0 last:pb-0",
          className,
        )}
      >
        <div className={cn("space-y-1.5", headerClassName)}>
          <h2 className="text-base font-semibold leading-snug text-foreground">
            {title}
          </h2>
          {description ? (
            <div className="max-w-2xl text-small text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        <div className={contentClassName}>{children}</div>
        {footer ? <div className={cn("pt-1", footerClassName)}>{footer}</div> : null}
      </section>
    );
  }

  return (
    <Card className={cn("mb-0", className)}>
      <CardHeader className={headerClassName}>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer ? (
        <CardFooter className={cn("justify-end", footerClassName)}>{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
