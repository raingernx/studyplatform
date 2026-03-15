import { cn } from "@/lib/utils";

interface ResourcePriceBadgeProps {
  /** "Free" | "Owned" | "THB 1,200" etc. */
  label: string;
  variant?: "free" | "owned" | "price";
  className?: string;
}

/** Price/status badge for ResourceCard meta row. */
export function ResourcePriceBadge({
  label,
  variant = "price",
  className,
}: ResourcePriceBadgeProps) {
  return (
    <span
      className={cn(
        "shrink-0 font-medium font-thai",
        variant === "free" && "text-green-700",
        variant === "owned" && "text-neutral-600",
        (variant === "price" || !variant) && "text-emerald-600",
        className
      )}
    >
      {label}
    </span>
  );
}
