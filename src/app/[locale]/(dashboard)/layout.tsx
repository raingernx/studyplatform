import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface DashboardGroupLayoutProps {
  children: ReactNode;
}

export default async function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  const session = await getServerSession(authOptions);

  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
    subscriptionStatus: session?.user?.subscriptionStatus ?? "INACTIVE",
  };

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}

