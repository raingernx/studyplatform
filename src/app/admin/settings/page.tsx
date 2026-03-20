import { AdminSettingsClient } from "./AdminSettingsClient";
import { getPlatform } from "@/services/platform.service";

export default async function AdminSettingsPage() {
  const platform = await getPlatform();

  return <AdminSettingsClient initialPlatformSettings={platform} />;
}
