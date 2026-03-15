import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type IconProps = {
  icon: LucideIcon;
  className?: string;
};

export function Icon({ icon: IconComponent, className }: IconProps) {
  return <IconComponent className={cn("h-4 w-4", className)} aria-hidden="true" />;
}

