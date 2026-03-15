import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { ActivityLogClient } from "./ActivityLogClient";

export const metadata = {
  title: "Activity – Admin",
  description: "View recent admin activity in PaperDock.",
};

export default async function AdminActivityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/activity");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <ActivityLogClient />;
}

