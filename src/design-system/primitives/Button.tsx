import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-xl border border-transparent bg-clip-padding",
    "font-ui text-sm font-semibold whitespace-nowrap",
    "transition-all outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
        default:
          "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
        dark:
          "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground",
        secondary:
          "border-border bg-card text-foreground hover:border-primary/20 hover:bg-muted",
        outline:
          "border-border bg-card text-foreground hover:border-primary/20 hover:bg-muted",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/20",
        destructive:
          "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus-visible:ring-red-500/20",
        accent:
          "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus-visible:ring-warning-500/20",
        link:
          "text-primary-700 underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-8 gap-1 rounded-lg px-2.5 text-caption",
        sm: "h-9 gap-1.5 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        default: "h-11 px-4 text-sm",
        icon: "size-10",
        "icon-xs": "size-8 rounded-lg",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

type PrimitiveButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    fullWidth?: boolean
  }

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "destructive"
  | "accent"
  | "link"

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon"

export interface ButtonProps
  extends Omit<PrimitiveButtonProps, "variant" | "size" | "children"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  asChild,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

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
        children
      ) : (
        <>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {!loading && leftIcon ? (
            <span aria-hidden="true" className="inline-flex items-center">
              {leftIcon}
            </span>
          ) : null}
          {children}
          {!loading && rightIcon ? (
            <span aria-hidden="true" className="inline-flex items-center">
              {rightIcon}
            </span>
          ) : null}
        </>
      )}
    </Comp>
  )
}

Button.displayName = "Button"

export { Button, buttonVariants }
