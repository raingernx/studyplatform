import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base — pill shape, small text, no border by default
  "inline-flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        // ── Semantic (KruCraft design system) ────────────────────────────
        success:     "bg-success-50  text-success-700",
        warning:     "bg-warning-50  text-warning-600",
        neutral:     "bg-surface-100 text-text-secondary",
        info:        "bg-brand-50    text-brand-700",

        // KruCraft marketplace badges
        featured:    "bg-accent-yellow-soft text-neutral-900",
        owned:       "bg-violet-50         text-violet-600",
        new:         "bg-accent-blue-soft  text-accent-blue",
        free:        "bg-green-50          text-green-600",

        // ── Shadcn-compatible aliases (kept for backward compat) ──────────
        default:     "bg-primary    text-primary-foreground",
        secondary:   "bg-surface-100 text-text-secondary",
        destructive: "bg-red-50     text-red-600",
        outline:     "border border-surface-200 text-text-primary bg-transparent",
        ghost:       "bg-transparent text-text-secondary hover:bg-surface-100",
        link:        "text-brand-600 underline-offset-3 hover:underline bg-transparent",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
