"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type NavbarItemVariant = "default" | "active" | "primary" | "secondary";

interface NavbarItemProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  mobile?: boolean;
  className?: string;
  variant?: NavbarItemVariant;
}

export function NavbarItem({
  href,
  children,
  onClick,
  mobile = false,
  className,
  variant = "default",
}: NavbarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-ui inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150",
        mobile ? "w-full rounded-lg px-4 py-2.5" : "h-10 rounded-lg px-4",
        variant === "primary"
          ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
          : variant === "secondary"
            ? "bg-white text-text-primary shadow-sm ring-1 ring-surface-200 hover:bg-surface-50"
          : variant === "active"
            ? mobile
              ? "bg-brand-50 text-brand-600"
              : "bg-surface-100 text-text-primary shadow-sm ring-1 ring-surface-200"
            : "text-text-secondary hover:bg-surface-100 hover:text-text-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export type { NavbarItemVariant };
