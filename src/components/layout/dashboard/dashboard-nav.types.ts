import type { LucideIcon } from "lucide-react";

export type DashboardShellVariant = "user" | "creator" | "admin";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
  badge?: string | number;
}

export interface DashboardNavSection {
  id: string;
  label: string;
  items: DashboardNavItem[];
}

