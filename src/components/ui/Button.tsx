import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles shared by every variant
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-md border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap",
    "transition-all outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // ── PaperDock brand primary (blue) ─────────────────────────────────
        primary:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500/50",

        // ── Default (zinc/dark) — kept as alias for "primary" look in shadcn contexts ──
        default:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500/50",

        // ── Kept for backward compat ───────────────────────────────────────
        dark:
          "bg-zinc-900 text-white hover:bg-zinc-700 active:bg-zinc-800 focus-visible:ring-zinc-700/50",

        // ── Secondary — outlined, neutral ──────────────────────────────────
        secondary:
          "border-surface-200 bg-white text-text-primary hover:border-surface-300 hover:bg-surface-50 focus-visible:ring-surface-400/40",

        // ── Outline — alias for secondary ──────────────────────────────────
        outline:
          "border-surface-200 bg-white text-text-primary hover:border-surface-300 hover:bg-surface-50 focus-visible:ring-surface-400/40",

        // ── Ghost — subtle border + hover ─────────────────────────────────
        ghost:
          "bg-transparent text-text-secondary border-border-subtle hover:bg-surface-100 hover:text-text-primary focus-visible:ring-surface-400/40",

        // ── Danger — solid red ─────────────────────────────────────────────
        danger:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500/50",

        // ── Destructive — subtle red (for inline/table contexts) ───────────
        destructive:
          "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200 focus-visible:ring-red-500/30",

        // ── Accent — orange highlight ──────────────────────────────────────
        accent:
          "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-400/50",

        // ── Link ───────────────────────────────────────────────────────────
        link:
          "text-brand-600 underline-offset-4 hover:underline focus-visible:ring-brand-500/30",
      },
      size: {
        // Named sizes matching the spec
        sm:  "h-10 px-2.5 text-[0.8rem] gap-1",
        md:  "h-[42px] px-3.5 text-sm",
        lg:  "h-11 px-5 text-base",

        // Aliases kept for backward compat
        xs:      "h-6 px-2 text-xs gap-1 rounded-md",
        default: "h-[42px] px-3.5 text-sm",

        // Icon-only
        icon:    "size-9",
        "icon-xs":  "size-6 rounded-md",
        "icon-sm":  "size-7",
        "icon-lg":  "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  fullWidth = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    fullWidth?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {asChild ? (
        // Slot.Root (radix-ui) uses React.Children.only — it must receive exactly
        // one React element. Skip the loading spinner when asChild is true.
        children
      ) : (
        <>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
