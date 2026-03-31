import { AdminSettingsClient } from "./AdminSettingsClient";
import { getBuildSafePlatformConfig } from "@/services/platform.service";

export default async function AdminSettingsPage() {
  const platform = getBuildSafePlatformConfig();

  return <AdminSettingsClient initialPlatformSettings={platform} />;
}
