import { cn } from "@/lib/utils";

/** PaperDock Design System: free, price, owned, featured. Legacy: blue, purple, orange, green, gray, red, dark. */
type BadgeVariant =
  | "free"
  | "price"
  | "owned"
  | "featured"
  | "blue"
  | "purple"
  | "orange"
  | "green"
  | "gray"
  | "red"
  | "dark";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  free: "bg-green-100 text-green-700",
  price: "bg-blue-100 text-blue-700",
  owned: "bg-neutral-100 text-neutral-700",
  featured: "bg-amber-100 text-amber-700",
  blue: "bg-blue-50 text-blue-700 ring-blue-200/60 ring-1 ring-inset",
  purple: "bg-violet-50 text-violet-700 ring-violet-200/60 ring-1 ring-inset",
  orange: "bg-orange-50 text-orange-700 ring-orange-200/60 ring-1 ring-inset",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200/60 ring-1 ring-inset",
  gray: "bg-zinc-100 text-zinc-600 ring-zinc-200/60 ring-1 ring-inset",
  red: "bg-red-50 text-red-700 ring-red-200/60 ring-1 ring-inset",
  dark: "bg-zinc-900 text-zinc-100 ring-zinc-800 ring-1 ring-inset",
};

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const isDesignSystem = ["free", "price", "owned", "featured"].includes(variant);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        isDesignSystem ? "text-xs font-medium" : "text-[11px] font-semibold tracking-wide",
        styles[variant],
        !isDesignSystem && "ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}
