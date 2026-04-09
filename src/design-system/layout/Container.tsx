import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface LayoutPrimitiveProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export interface ContainerProps extends LayoutPrimitiveProps {
  narrow?: boolean;
}

export const CONTAINER_BASE_CLASS_NAME = "mx-auto w-full min-w-0";
export const CONTAINER_MAX_WIDTH_CLASS_NAME =
  `${CONTAINER_BASE_CLASS_NAME} max-w-[var(--container-max-width)]`;
export const CONTAINER_NARROW_MAX_WIDTH_CLASS_NAME =
  "max-w-[var(--container-narrow-max-width)]";
export const CONTAINER_PADDING_CLASS_NAME = "px-4 sm:px-6 lg:px-8";
export const CONTAINER_CLASS_NAME =
  `${CONTAINER_MAX_WIDTH_CLASS_NAME} ${CONTAINER_PADDING_CLASS_NAME}`;
export const PAGE_CONTENT_MAX_WIDTH_CLASS_NAME =
  "max-w-[var(--page-content-max-width)]";
export const PAGE_CONTENT_WIDE_MAX_WIDTH_CLASS_NAME =
  "max-w-[var(--page-content-wide-max-width)]";
export const PAGE_CONTENT_NARROW_MAX_WIDTH_CLASS_NAME =
  "max-w-[var(--page-content-narrow-max-width)]";

export function Container({ children, className, narrow = false, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      className={cn(
        CONTAINER_CLASS_NAME,
        narrow && CONTAINER_NARROW_MAX_WIDTH_CLASS_NAME,
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageWidthProps extends LayoutPrimitiveProps {
  maxWidthClassName: string;
}

function PageWidth({
  children,
  className,
  maxWidthClassName,
  ...props
}: PageWidthProps) {
  return (
    <div
      {...props}
      className={cn(CONTAINER_BASE_CLASS_NAME, maxWidthClassName, className)}
    >
      {children}
    </div>
  );
}

export function PageContainer({ children, className, ...props }: LayoutPrimitiveProps) {
  return (
    <div {...props} className={cn("w-full", CONTAINER_PADDING_CLASS_NAME, className)}>
      {children}
    </div>
  );
}

export function PageContent({ children, className, ...props }: LayoutPrimitiveProps) {
  return (
    <PageWidth
      maxWidthClassName={PAGE_CONTENT_MAX_WIDTH_CLASS_NAME}
      className={className}
      {...props}
    >
      {children}
    </PageWidth>
  );
}

export function PageContentWide({ children, className, ...props }: LayoutPrimitiveProps) {
  return (
    <PageWidth
      maxWidthClassName={PAGE_CONTENT_WIDE_MAX_WIDTH_CLASS_NAME}
      className={className}
      {...props}
    >
      {children}
    </PageWidth>
  );
}

export function PageContentNarrow({ children, className, ...props }: LayoutPrimitiveProps) {
  return (
    <PageWidth
      maxWidthClassName={PAGE_CONTENT_NARROW_MAX_WIDTH_CLASS_NAME}
      className={className}
      {...props}
    >
      {children}
    </PageWidth>
  );
}
