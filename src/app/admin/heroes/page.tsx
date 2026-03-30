import { Plus } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/format";
import { getFallbackHero, getHeroList, hasEligibleCmsHero } from "@/services/heroes/hero.service";
import { HeroListActions } from "@/components/admin/heroes/HeroListActions";
import { Button } from "@/design-system";
import { Card } from "@/design-system";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadCell,
  DataTableHeader,
  DataTableRow,
  TableEmptyState,
  TableToolbar,
} from "@/components/admin/table";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

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
  await requireAdminSession(routes.adminHeroes);

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
        <Card className="border-warning-200 bg-warning-50/60 p-5">
          <div className="space-y-1">
            <p className="font-medium text-warning-900">
              Homepage is currently using the fallback hero.
            </p>
            <p className="text-small text-warning-800">
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

      <TableToolbar className="items-center">
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
                  ? "border-primary-200 bg-primary-50 text-primary-700"
                  : "border-surface-200 bg-white text-text-secondary hover:border-surface-300 hover:text-text-primary",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          );
        })}
      </TableToolbar>

      <DataTable minWidth="min-w-[1100px]">
        {heroes.length === 0 ? (
          <div className="px-4">
            <table className="w-full">
              <tbody>
                <TableEmptyState
                  message="No CMS heroes yet"
                  description="Create a campaign hero to override the protected fallback hero when it is active and in schedule."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href={routes.adminNewHero}>Create your first hero</Link>
                    </Button>
                  }
                  className="py-14"
                />
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <DataTableHeader>
              <tr>
                <DataTableHeadCell className="px-2">Name</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Type</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Priority</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Weight</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Schedule</DataTableHeadCell>
                <DataTableHeadCell className="px-3">A/B group</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Status</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Impressions</DataTableHeadCell>
                <DataTableHeadCell className="px-3">Clicks</DataTableHeadCell>
                <DataTableHeadCell className="px-3">CTR</DataTableHeadCell>
                <DataTableHeadCell className="px-3" align="right">Actions</DataTableHeadCell>
              </tr>
            </DataTableHeader>
            <DataTableBody>
                {heroes.map((hero) => {
                const heroStatusLabel = getStatusLabel(hero);
                return (
                  <DataTableRow key={hero.id}>
                    <DataTableCell className="px-2 font-medium text-text-primary">{hero.name}</DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">
                      {hero.isFallback ? "fallback" : hero.type}
                    </DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">
                      {hero.isFallback ? "—" : hero.priority}
                    </DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">
                      {hero.isFallback ? "—" : hero.weight}
                    </DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">
                      {hero.isFallback ? "Always available" : formatSchedule(hero.startDate, hero.endDate)}
                    </DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">
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
                              <div className="text-caption text-text-muted">
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
                    </DataTableCell>
                    <DataTableCell className="px-3">
                      <StatusBadge
                        status={heroStatusLabel}
                        tone={heroStatusTone(heroStatusLabel)}
                      />
                    </DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">{hero.impressions}</DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">{hero.clicks}</DataTableCell>
                    <DataTableCell className="px-3 text-text-secondary">{hero.ctr.toFixed(2)}%</DataTableCell>
                    <DataTableCell className="px-3" align="right">
                      <HeroListActions
                        heroId={hero.id}
                        heroName={hero.name}
                        isActive={hero.isActive}
                        isFallback={hero.isFallback}
                      />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </>
        )}
      </DataTable>
    </div>
  );
}
