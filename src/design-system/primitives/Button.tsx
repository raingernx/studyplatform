import * as React from "react"

import {
  Button as UIButton,
  buttonVariants,
} from "@/components/ui/Button"

type UIButtonProps = React.ComponentProps<typeof UIButton>

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "destructive"
  | "link"

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon"

export interface ButtonProps
  extends Omit<UIButtonProps, "variant" | "size" | "loading" | "children"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

const VARIANT_MAP: Record<ButtonVariant, NonNullable<UIButtonProps["variant"]>> = {
  primary: "primary",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
  danger: "danger",
  destructive: "destructive",
  link: "link",
}

const SIZE_MAP: Record<ButtonSize, NonNullable<UIButtonProps["size"]>> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  icon: "icon",
}

function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  asChild,
  ...props
}: ButtonProps) {
  return (
    <UIButton
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      loading={loading}
      asChild={asChild}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
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
    </UIButton>
  )
}

Button.displayName = "Button"

export { Button, buttonVariants }
