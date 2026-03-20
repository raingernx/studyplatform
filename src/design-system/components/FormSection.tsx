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

interface FormSectionProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  footer,
  className,
  children,
}: FormSectionProps) {
  return (
    <Card className={cn("mb-0", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter className="justify-end">{footer}</CardFooter> : null}
    </Card>
  );
}
