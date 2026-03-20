import * as React from "react";

import { Switch as UISwitch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";

type UISwitchProps = React.ComponentProps<typeof UISwitch>;

const Switch = React.forwardRef<
  React.ElementRef<typeof UISwitch>,
  UISwitchProps
>(({ className, disabled, ...props }, ref) => {
  return (
    <UISwitch
      ref={ref}
      disabled={disabled}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      {...props}
    />
  );
});

Switch.displayName = "Switch";

export { Switch };
