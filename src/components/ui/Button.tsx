import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "accent" | "dark";
type Size    = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // Jet-black — for primary hero CTAs (Linear/Vercel style)
  dark:
    "bg-zinc-900 text-white shadow-card hover:bg-zinc-700 active:bg-zinc-800 " +
    "focus-visible:ring-zinc-700",

  // Solid blue
  primary:
    "bg-blue-600 text-white shadow-card hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:ring-blue-500",

  // Solid violet
  secondary:
    "bg-violet-600 text-white shadow-card hover:bg-violet-700 active:bg-violet-800 " +
    "focus-visible:ring-violet-500",

  // Warm orange — for accent CTAs
  accent:
    "bg-orange-500 text-white shadow-glow-orange hover:bg-orange-600 active:bg-orange-700 " +
    "focus-visible:ring-orange-400",

  // White with border
  outline:
    "border border-zinc-200 bg-white text-zinc-700 shadow-card " +
    "hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-card-md " +
    "focus-visible:ring-blue-500",

  // Transparent
  ghost:
    "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 " +
    "focus-visible:ring-zinc-400",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
  sm: "h-8 px-3 text-[13px] rounded-xl gap-1.5",
  md: "h-9 px-4 text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-[15px] rounded-xl gap-2",
};

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth = false,
     className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";
