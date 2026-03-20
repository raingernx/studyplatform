import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutPrimitiveProps {
  children: ReactNode;
  className?: string;
}

interface ContainerProps extends LayoutPrimitiveProps {
  narrow?: boolean;
}

export function Container({ children, className, narrow = false }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl",
        narrow ? "px-4 sm:px-6" : "px-6 sm:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PageWidth({
  children,
  className,
  maxWidthClassName,
}: LayoutPrimitiveProps & { maxWidthClassName: string }) {
  return (
    <div className={cn("mx-auto w-full min-w-0", maxWidthClassName, className)}>
      {children}
    </div>
  );
}

export function PageContainer({ children, className }: LayoutPrimitiveProps) {
  return <div className={cn("w-full px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function PageContent({ children, className }: LayoutPrimitiveProps) {
  return (
    <PageWidth maxWidthClassName="max-w-[1100px]" className={className}>
      {children}
    </PageWidth>
  );
}

export function PageContentWide({ children, className }: LayoutPrimitiveProps) {
  return (
    <PageWidth maxWidthClassName="max-w-[1400px]" className={className}>
      {children}
    </PageWidth>
  );
}

export function PageContentNarrow({ children, className }: LayoutPrimitiveProps) {
  return (
    <PageWidth maxWidthClassName="max-w-[800px]" className={className}>
      {children}
    </PageWidth>
  );
}
