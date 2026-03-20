import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Megaphone, Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/format";
import { getFallbackHero, getHeroList, hasEligibleCmsHero } from "@/services/heroes/hero.service";
import { HeroListActions } from "@/components/admin/heroes/HeroListActions";
import { Button } from "@/design-system";
import { Card } from "@/design-system";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata = {
  title: "Heroes – Admin",
  description: "View and manage marketing hero campaigns.",
};

type Props = {
  searchParams?: Promise<{ status?: string }>;
};

function formatSchedule(startDate: Date | null, endDate: Date | null) {
  if (!startDate && !endDate) {
    return "Always on";
  }

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `Starts ${formatDate(startDate)}`;
  }

  return `Ends ${formatDate(endDate as Date)}`;
}

function getStatusLabel(hero: {
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  isFallback?: boolean;
}) {
  if (hero.isFallback) {
    return "Active";
  }

  if (!hero.isActive) {
    return "Inactive";
  }

  const now = new Date();

  if (hero.startDate && hero.startDate >= now) {
    return "Scheduled";
  }

  if (hero.endDate && hero.endDate <= now) {
    return "Expired";
  }

  return "Active";
}

function heroStatusTone(label: string): StatusBadgeTone {
  if (label === "Active") return "success";
  if (label === "Scheduled") return "warning";
  return "muted"; // Inactive, Expired
}

export default async function AdminHeroesPage({ searchParams }: Props) {
  const resolvedSearchParams =
    typeof (searchParams as Promise<unknown>)?.then === "function"
      ? await (searchParams as Promise<{ status?: string }>)
      : (searchParams as { status?: string } | undefined);
  const statusFilter =
    resolvedSearchParams?.status === "active" ||
    resolvedSearchParams?.status === "scheduled" ||
    resolvedSearchParams?.status === "expired"
      ? resolvedSearchParams.status
      : "all";
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/heroes");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [heroes, hasEligibleHero, fallbackHero] = await Promise.all([
    getHeroList(statusFilter),
    hasEligibleCmsHero(),
    getFallbackHero(),
  ]);

  const filterLinks = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "scheduled", label: "Scheduled" },
    { value: "expired", label: "Expired" },
  ] as const;

  return (
    <div className="min-w-0 space-y-8">
      <AdminPageHeader
        title="Heroes"
        description="Marketing hero campaigns for the marketplace homepage."
        actions={
          <Button asChild size="sm" variant="outline" className="inline-flex items-center gap-2">
            <Link href={routes.adminNewHero}>
              <Plus className="h-4 w-4" />
              <span>Create Hero</span>
            </Link>
          </Button>
        }
      />

      {!hasEligibleHero ? (
        <Card className="border-amber-200 bg-amber-50/60 p-5">
          <div className="space-y-1">
            <p className="font-medium text-amber-900">
              Homepage is currently using the fallback hero.
            </p>
            <p className="text-sm text-amber-800">
              No eligible campaign hero is active right now.{" "}
              {fallbackHero ? (
                <>
                  The protected fallback hero is keeping the homepage safe. You can edit it{" "}
                  <Link
                    href={routes.adminHero(fallbackHero.id)}
                    className="font-medium underline underline-offset-2"
                  >
                    here
                  </Link>
                  .
                </>
              ) : (
                "Create or migrate a fallback hero to keep the homepage safe."
              )}
            </p>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {filterLinks.map((filter) => {
          const active = statusFilter === filter.value;
          const href =
            filter.value === "all"
              ? routes.adminHeroes
              : `${routes.adminHeroes}?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-surface-200 bg-white text-text-secondary hover:border-surface-300 hover:text-text-primary",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        {heroes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <Megaphone className="h-7 w-7 text-brand-600" />
            </span>
            <div>
              <p className="font-semibold text-text-primary">
                No CMS heroes yet
              </p>
              <p className="mt-1.5 max-w-md text-sm text-text-secondary">
                Create a campaign hero to override the protected fallback hero when it is active and in schedule.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={routes.adminNewHero}>Create your first hero</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface-50/80">
                <tr>
                  <th className="px-2 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Name</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Type</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Priority</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Weight</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Schedule</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">A/B group</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Status</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Impressions</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">Clicks</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-tightest text-text-secondary">CTR</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {heroes.map((hero) => {
                const heroStatusLabel = getStatusLabel(hero);
                return (
                  <tr key={hero.id} className="bg-white transition-colors hover:bg-surface-50">
                    <td className="px-2 py-3 font-medium text-text-primary">{hero.name}</td>
                    <td className="px-3 py-3 text-text-secondary">
                      {hero.isFallback ? "fallback" : hero.type}
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      {hero.isFallback ? "—" : hero.priority}
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      {hero.isFallback ? "—" : hero.weight}
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      {hero.isFallback ? "Always available" : formatSchedule(hero.startDate, hero.endDate)}
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      {hero.isFallback ? (
                        "—"
                      ) : hero.variantAnalytics.length > 0 ? (
                        <div className="space-y-1">
                          {hero.variantAnalytics.map((variantStat) => (
                            <div key={`${variantStat.experimentId ?? "none"}:${variantStat.variant ?? "none"}`}>
                              <div className="font-medium text-text-primary">
                                {variantStat.experimentId
                                  ? `${variantStat.experimentId}:${variantStat.variant ?? "default"}`
                                  : variantStat.variant ?? hero.abGroup ?? "default"}
                              </div>
                              <div className="text-xs text-text-muted">
                                {variantStat.impressions} imp · {variantStat.clicks} clicks ·{" "}
                                {variantStat.ctr.toFixed(2)}% CTR
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : hero.experimentId && hero.variant ? (
                        `${hero.experimentId}:${hero.variant}`
                      ) : (
                        hero.abGroup ?? "—"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        status={heroStatusLabel}
                        tone={heroStatusTone(heroStatusLabel)}
                      />
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{hero.impressions}</td>
                    <td className="px-3 py-3 text-text-secondary">{hero.clicks}</td>
                    <td className="px-3 py-3 text-text-secondary">{hero.ctr.toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right">
                      <HeroListActions
                        heroId={hero.id}
                        heroName={hero.name}
                        isActive={hero.isActive}
                        isFallback={hero.isFallback}
                      />
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
