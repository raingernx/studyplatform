import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/auth/require-session";
import {
  BookOpen,
  Download,
  CreditCard,
  Sparkles,
  ArrowRight,
  FileText,
  TrendingUp,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import {
  getUserLearningProfile,
  getUserDownloadCount,
  getUserPurchases,
} from "@/services/purchases";
import { getDashboardOverviewRecommendations } from "@/services/resources/resource.service";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";

export const metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

function formatLevelLabel(level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED") {
  switch (level) {
    case "BEGINNER":
      return "Beginner";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
    default:
      return null;
  }
}

interface WorkspaceStatProps {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof BookOpen;
}

function WorkspaceStat({ label, value, detail, icon: Icon }: WorkspaceStatProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-small font-medium text-muted-foreground">{label}</p>
        <p className="text-caption text-muted-foreground/80">{detail}</p>
      </div>
    </div>
  );
}

interface DashboardShelfResource {
  id: string;
  slug: string;
  title: string;
  previewUrl?: string | null;
  isFree: boolean;
  price: number;
  author?: { name?: string | null } | null;
}

function DashboardShelfCard({
  resource,
  meta,
  widthClassName = "w-[220px]",
}: {
  resource: DashboardShelfResource;
  meta?: string | null;
  widthClassName?: string;
}) {
  return (
    <ResourceIntentLink
      href={routes.resource(resource.slug)}
      className={`group flex ${widthClassName} h-[248px] flex-shrink-0 flex-col rounded-xl border border-border bg-card p-3.5 transition hover:bg-accent/40`}
    >
      <div className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {resource.previewUrl ? (
          <Image
            src={resource.previewUrl}
            alt={resource.title}
            fill
            sizes="(min-width: 1280px) 220px, (min-width: 768px) 204px, 70vw"
            unoptimized={shouldBypassImageOptimizer(resource.previewUrl)}
            className="object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80">
            <FileText className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="mt-3 flex min-h-[54px] flex-1 flex-col justify-start space-y-0.5">
        <p className="line-clamp-2 text-small font-semibold leading-5 text-foreground">
          {resource.title}
        </p>
        <p className="line-clamp-1 text-caption text-muted-foreground">
          {meta ?? resource.author?.name ?? "Unknown"}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-small font-semibold text-foreground">
          {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
        </span>
        <span className="text-caption font-medium text-primary-700 transition group-hover:text-primary-800">
          Open
        </span>
      </div>
    </ResourceIntentLink>
  );
}

export default async function DashboardPage() {
  return withRequestPerformanceTrace(
    "route:/dashboard",
    {
      routeKind: "overview",
    },
    async () => {
      const { userId, session } = await traceServerStep("dashboard.requireSession", () =>
        requireSession(routes.dashboard),
      );

      const [purchases, totalDownloads, learningProfile] = await Promise.all([
        traceServerStep("dashboard.getUserPurchases", () => getUserPurchases(userId)),
        traceServerStep("dashboard.getUserDownloadCount", () => getUserDownloadCount(userId)),
        traceServerStep("dashboard.getUserLearningProfile", () => getUserLearningProfile(userId)),
      ]);
      const ownedResourceIds = purchases.map((purchase) => purchase.resource.id);
      const topCategoryIds = learningProfile.topCategories.map((category) => category.id);
      const primaryLevel = learningProfile.preferredLevels[0];
      const { recommended, newInCategories, levelRecommendations } = await traceServerStep(
        "dashboard.getDashboardOverviewRecommendations",
        () =>
          getDashboardOverviewRecommendations({
            ownedResourceIds,
            topCategoryIds,
            preferredLevels: learningProfile.preferredLevels,
          }),
        {
          ownedCount: ownedResourceIds.length,
          topCategoryCount: topCategoryIds.length,
          preferredLevelCount: learningProfile.preferredLevels.length,
        },
      );

      const isSubscribed = session.user.subscriptionStatus === "ACTIVE";
      const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
      const lastOpened = purchases[0] ?? null;
      const recentPurchases = purchases.slice(0, 4);
      const nextBestAction = recommended[0] ?? null;
      const continueLearningCategory = lastOpened?.resource.category?.name ?? null;
      const becauseYouPickedUp = lastOpened?.resource.title ?? null;
      const multiCategoryLabel = learningProfile.topCategories.map((category) => category.name);
      const levelLabel = formatLevelLabel(primaryLevel);

      const firstName = session.user.name?.split(" ")[0] ?? "there";

      const STATS = [
        {
          label: "Resources owned",
          value: purchases.length,
          icon: BookOpen,
          detail: "In your library",
        },
        {
          label: "Total downloads",
          value: totalDownloads,
          icon: Download,
          detail: "Recorded activity",
        },
        {
          label: "Total spent",
          value: formatPrice(totalSpent / 100),
          icon: CreditCard,
          detail: "Lifetime",
        },
        {
          label: "Membership",
          value: isSubscribed ? "Pro" : "Free",
          icon: Sparkles,
          detail: isSubscribed ? "Active now" : "Upgrade available",
        },
      ];

      const quickLinks = [
        {
          href: routes.library,
          label: "My Library",
          icon: BookOpen,
          count: purchases.length,
        },
        {
          href: routes.downloads,
          label: "Downloads",
          icon: Download,
          count: totalDownloads,
        },
        {
          href: routes.marketplace,
          label: "Marketplace",
          icon: TrendingUp,
          count: null,
        },
      ];

      return (
        <div data-route-shell-ready="dashboard-overview" className="space-y-8">
          <section className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
                Welcome back, {firstName}
              </h1>
              <p className="max-w-2xl text-small leading-6 text-muted-foreground">
                Your dashboard keeps recent activity, saved resources, and the next useful pick in
                one place.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
              <div className="h-full rounded-xl border border-border bg-card px-5 py-4 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {STATS.map((stat) => (
                    <WorkspaceStat
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      detail={stat.detail}
                      icon={stat.icon}
                    />
                  ))}
                </div>
              </div>

              <aside className="flex h-full flex-col justify-between rounded-xl border border-border bg-card px-5 py-3.5 sm:px-6">
                <div className="space-y-1">
                  <p className="text-caption font-semibold text-muted-foreground">Plan</p>
                  <h2 className="text-base font-semibold text-foreground">
                    {isSubscribed ? "Pro membership is active" : "Upgrade when you need more"}
                  </h2>
                  <p className="text-small leading-6 text-muted-foreground">
                    {isSubscribed
                      ? "Keep building your classroom toolkit with unlimited access perks."
                      : "Unlock more downloads, faster browsing, and premium resource packs."}
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 text-small font-medium text-foreground transition hover:bg-card"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                          {item.label}
                        </span>
                        <span className="flex items-center gap-2 text-caption text-muted-foreground">
                          {item.count !== null ? <span>{item.count}</span> : null}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </aside>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
            <div className="space-y-4 rounded-xl border border-border bg-card px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-caption font-semibold text-muted-foreground">Continue</p>
                  <h2 className="text-lg font-semibold text-foreground">Pick up where you left off</h2>
                </div>
                <Link
                  href={routes.library}
                  className="text-caption font-medium text-primary-700 transition hover:text-primary-800"
                >
                  Open library
                </Link>
              </div>

              {recentPurchases.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentPurchases.map((purchase) => (
                    <ResourceIntentLink
                      key={purchase.id}
                      href={routes.resource(purchase.resource.slug)}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-muted">
                        {purchase.resource.previewUrl ? (
                          <Image
                            src={purchase.resource.previewUrl}
                            alt={purchase.resource.title}
                            fill
                            sizes="56px"
                            unoptimized={shouldBypassImageOptimizer(purchase.resource.previewUrl)}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-small font-semibold text-foreground">
                          {purchase.resource.title}
                        </p>
                        <p className="truncate text-caption text-muted-foreground">
                          {purchase.resource.author?.name ?? "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-caption font-medium text-foreground">
                          {formatDate(purchase.createdAt)}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {purchase.resource.category?.name ?? "Resource"}
                        </p>
                      </div>
                    </ResourceIntentLink>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
                  <p className="text-small font-semibold text-foreground">No recent resources yet</p>
                  <p className="mt-1 text-small leading-6 text-muted-foreground">
                    Your newest purchases will show up here once you start building your library.
                  </p>
                  <Link
                    href={routes.marketplace}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-small font-semibold text-background transition hover:opacity-90"
                  >
                    Browse resources
                  </Link>
                </div>
              )}
            </div>

            <aside className="space-y-4 rounded-xl border border-border bg-card px-5 py-4 sm:px-6">
              <div className="space-y-1">
                <p className="text-caption font-semibold text-muted-foreground">Personalized</p>
                <h2 className="text-lg font-semibold text-foreground">Next best action</h2>
              </div>

              {nextBestAction ? (
                <DashboardShelfCard
                  resource={nextBestAction}
                  meta={continueLearningCategory ? `Because of ${continueLearningCategory}` : null}
                  widthClassName="w-full"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
                  <p className="text-small font-semibold text-foreground">Recommendations unlock after your first purchase</p>
                  <p className="mt-1 text-small leading-6 text-muted-foreground">
                    Explore the marketplace and we will highlight the most useful follow-up picks here.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/50 px-4 py-3.5">
                <p className="text-caption font-semibold text-muted-foreground">Why these picks</p>
                <div className="mt-2 space-y-1.5 text-small text-muted-foreground">
                  {becauseYouPickedUp ? (
                    <p>
                      Based on <span className="font-medium text-foreground">{becauseYouPickedUp}</span>
                    </p>
                  ) : null}
                  {multiCategoryLabel.length > 0 ? (
                    <p>
                      Top categories:{" "}
                      <span className="font-medium text-foreground">
                        {multiCategoryLabel.slice(0, 3).join(", ")}
                      </span>
                    </p>
                  ) : null}
                  {levelLabel ? (
                    <p>
                      Preferred level: <span className="font-medium text-foreground">{levelLabel}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-caption font-semibold text-muted-foreground">Recommended</p>
                <h2 className="text-lg font-semibold text-foreground">More to explore</h2>
              </div>
              <Link
                href={routes.marketplace}
                className="text-caption font-medium text-primary-700 transition hover:text-primary-800"
              >
                View marketplace
              </Link>
            </div>

            <div className="space-y-6">
              {recommended.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Recommended for you</h3>
                      <p className="text-small text-muted-foreground">
                        Picks based on what you already own and study most often.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {recommended.map((resource) => (
                      <DashboardShelfCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              ) : null}

              {newInCategories.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">New in your top categories</h3>
                    <p className="text-small text-muted-foreground">
                      Fresh additions for the subjects you come back to most.
                    </p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {newInCategories.map((resource) => (
                      <DashboardShelfCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              ) : null}

              {levelRecommendations.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {levelLabel ? `${levelLabel} picks` : "Level-based picks"}
                    </h3>
                    <p className="text-small text-muted-foreground">
                      Resources aligned with the difficulty you open most often.
                    </p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {levelRecommendations.map((resource) => (
                      <DashboardShelfCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      );
    },
  );
}
