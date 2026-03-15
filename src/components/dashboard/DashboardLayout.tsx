import type { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";

export interface DashboardUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionStatus?: string | null;
}

interface DashboardLayoutProps {
  children: ReactNode;
  user: DashboardUser;
}

/** Server-component wrapper — passes user data into the client shell. */
export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
