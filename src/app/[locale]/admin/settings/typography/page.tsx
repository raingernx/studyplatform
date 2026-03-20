import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TypographySettingsClient } from "@/components/admin/settings/TypographySettingsClient";
import { toPlatformTypographySettingsInput } from "@/lib/typography/typography-settings";
import { getTypographySettings } from "@/services/platformTypographySettings.service";

export const metadata = {
  title: "Typography Settings – Admin",
  description: "Manage global typography presets and overrides.",
};

export default async function AdminTypographySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/settings/typography");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getTypographySettings();

  return (
    <TypographySettingsClient
      initialSettings={toPlatformTypographySettingsInput(settings)}
    />
  );
}
