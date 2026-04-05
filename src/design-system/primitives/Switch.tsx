import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, disabled, ...props }, ref) => {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex h-6 w-[46px] items-center rounded-full bg-muted transition-colors duration-200",
        "data-[state=checked]:bg-primary-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "h-5 w-5 rounded-full bg-background shadow transition-transform duration-200",
          "translate-x-0.5 data-[state=checked]:translate-x-[24px]",
        )}
      />
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = "Switch"

export { Switch }
