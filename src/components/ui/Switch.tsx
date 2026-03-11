import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const rootClasses = [
    "inline-flex h-6 w-[46px] items-center rounded-full",
    "bg-surface-300",
    "data-[state=checked]:bg-brand-500",
    "transition-colors duration-200",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const thumbClasses = [
    "h-5 w-5 rounded-full bg-white shadow",
    "translate-x-0.5 data-[state=checked]:translate-x-5",
    "transition-transform duration-200",
  ].join(" ");

  return (
    <SwitchPrimitives.Root ref={ref} className={rootClasses} {...props}>
      <SwitchPrimitives.Thumb className={thumbClasses} />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = "Switch";

