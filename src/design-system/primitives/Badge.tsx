import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        success:
          "border-success-500/25 bg-accent text-success-600",
        warning:
          "border-warning-500/25 bg-accent text-warning-600",
        neutral: "bg-muted text-muted-foreground",
        info: "border-primary/25 bg-accent text-primary",
        featured: "border-highlight-500/25 bg-accent text-highlight-600",
        owned: "bg-violet-50 text-violet-600",
        new: "bg-accent-blue-soft text-accent-blue",
        free: "bg-green-50 text-green-600",
        default: "bg-primary text-primary-foreground",
        secondary: "bg-muted text-muted-foreground",
        destructive: "bg-red-50 text-red-600",
        outline: "border border-border-strong bg-transparent text-foreground",
        ghost: "bg-transparent text-muted-foreground hover:bg-muted",
        link: "bg-transparent text-brand-600 underline-offset-3 hover:underline",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
