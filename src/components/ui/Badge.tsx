import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "purple" | "orange" | "green" | "gray" | "red" | "dark";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  blue:   "bg-blue-50   text-blue-700   ring-blue-200/60",
  purple: "bg-violet-50 text-violet-700 ring-violet-200/60",
  orange: "bg-orange-50 text-orange-700 ring-orange-200/60",
  green:  "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  gray:   "bg-zinc-100  text-zinc-600   ring-zinc-200/60",
  red:    "bg-red-50    text-red-700    ring-red-200/60",
  dark:   "bg-zinc-900  text-zinc-100   ring-zinc-800",
};

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-[11px] font-semibold tracking-wide",
        "ring-1 ring-inset",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
