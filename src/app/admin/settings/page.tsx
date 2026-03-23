import { AdminSettingsClient } from "./AdminSettingsClient";
import { getPlatform } from "@/services/platform.service";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const platform = await getPlatform();

  return <AdminSettingsClient initialPlatformSettings={platform} />;
}
