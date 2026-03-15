import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Reduce padding on narrow viewports for tight layouts */
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
