import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HeroForm, type HeroFormValues } from "@/components/admin/heroes/HeroForm";
import { getHeroById } from "@/services/heroes/hero.service";

type Props = {
  params: Promise<{ id: string }>;
};

function toDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toFormValues(hero: NonNullable<Awaited<ReturnType<typeof getHeroById>>>): HeroFormValues {
  return {
    name: hero.name,
    type: hero.type as HeroFormValues["type"],
    title: hero.title,
    subtitle: hero.subtitle ?? "",
    badgeText: hero.badgeText ?? "",
    primaryCtaText: hero.primaryCtaText ?? "",
    primaryCtaLink: hero.primaryCtaLink ?? "",
    secondaryCtaText: hero.secondaryCtaText ?? "",
    secondaryCtaLink: hero.secondaryCtaLink ?? "",
    imageUrl: hero.imageUrl ?? "",
    mediaUrl: hero.mediaUrl ?? "",
    mediaType: (hero.mediaType as HeroFormValues["mediaType"]) ?? "",
    priority: hero.priority,
    weight: hero.weight,
    experimentId: hero.experimentId ?? "",
    variant: hero.variant ?? "",
    abGroup: hero.abGroup ?? "",
    startDate: toDateTimeLocalValue(hero.startDate),
    endDate: toDateTimeLocalValue(hero.endDate),
    isActive: hero.isActive,
  };
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const hero = await getHeroById(id);

  return {
    title: hero
      ? `${hero.isFallback ? "Edit Fallback Hero" : `Edit "${hero.name}"`} – Admin`
      : "Edit Hero – Admin",
  };
}

export default async function EditHeroPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/auth/login?next=/admin/heroes/${id}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const hero = await getHeroById(id);

  if (!hero) {
    notFound();
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            {hero.isFallback ? "Edit Fallback Hero" : "Edit Hero"}
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            {hero.isFallback
              ? "Update the protected homepage fallback hero from the Marketing → Heroes section."
              : "Update this campaign hero without affecting the protected fallback hero."}
          </p>
        </div>
      </div>

      <HeroForm
        mode="edit"
        heroId={hero.id}
        initialValues={toFormValues(hero)}
        isFallback={hero.isFallback}
      />
    </div>
  );
}
