import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HeroForm, type HeroFormValues } from "@/components/admin/heroes/HeroForm";

export const metadata = {
  title: "Create Hero – Admin",
  description: "Create a new marketing hero campaign.",
};

const DEFAULT_VALUES: HeroFormValues = {
  name: "",
  type: "featured",
  title: "",
  subtitle: "",
  badgeText: "",
  primaryCtaText: "",
  primaryCtaLink: "",
  secondaryCtaText: "",
  secondaryCtaLink: "",
  imageUrl: "",
  mediaUrl: "",
  mediaType: "",
  priority: 0,
  weight: 1,
  experimentId: "",
  variant: "",
  abGroup: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default async function NewHeroPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/heroes/new");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Create Hero
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Create a campaign hero that can override the protected fallback hero on the homepage.
          </p>
        </div>
      </div>

      <HeroForm mode="create" initialValues={DEFAULT_VALUES} />
    </div>
  );
}
