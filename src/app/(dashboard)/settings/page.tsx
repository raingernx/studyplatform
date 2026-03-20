import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPreferences } from "@/lib/preferences";
import { PageContentNarrow } from "@/design-system";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?next=/settings");

  const [user, preferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, createdAt: true },
    }),
    getUserPreferences(session.user.id),
  ]);

  return (
    <PageContentNarrow className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-h2 font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="text-[14px] text-zinc-500">
          Manage your account preferences and security.
        </p>
      </div>

      <SettingsTabs
        user={{
          name: user?.name ?? null,
          email: user?.email ?? null,
          image: user?.image ?? null,
        }}
        preferences={preferences}
      />
    </PageContentNarrow>
  );
}
