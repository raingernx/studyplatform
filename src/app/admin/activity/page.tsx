import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import { ActivityLogClient } from "./ActivityLogClient";

export const metadata = {
  title: "Activity – Admin",
  description: "View recent admin activity.",
};

export default async function AdminActivityPage() {
  await requireAdminSession(routes.adminActivity);

  return <ActivityLogClient />;
}
