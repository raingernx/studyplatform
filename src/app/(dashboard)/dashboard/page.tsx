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
} from "@/services/purchase.service";
import {
  getDashboardOverviewRecommendations,
} from "@/services/resources/public-resource-read.service";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { routes } from "@/lib/routes";

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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-50 text-zinc-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xl font-semibold tracking-tight text-zinc-900">{value}</p>
        <p className="text-small font-medium text-zinc-600">{label}</p>
        <p className="text-caption text-zinc-400">{detail}</p>
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
    <Link
      href={routes.resource(resource.slug)}
      className={`group flex ${widthClassName} h-[248px] flex-shrink-0 flex-col rounded-xl border border-surface-200 bg-white p-3.5 transition hover:border-surface-300 hover:bg-surface-50/40`}
    >
      <div className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg border border-surface-200 bg-surface-100">
        {resource.previewUrl ? (
          <Image
            src={resource.previewUrl}
            alt={resource.title}
            fill
            sizes="(min-width: 1280px) 220px, (min-width: 768px) 204px, 70vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85">
            <FileText className="h-6 w-6 text-zinc-300" />
          </div>
        )}
      </div>
      <div className="mt-3 flex min-h-[54px] flex-1 flex-col justify-start space-y-0.5">
        <p className="line-clamp-2 text-small font-semibold leading-5 text-zinc-900">
          {resource.title}
        </p>
        <p className="line-clamp-1 text-caption text-zinc-400">
          {meta ?? resource.author?.name ?? "Unknown"}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-small font-semibold text-zinc-900">
          {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
        </span>
        <span className="text-caption font-medium text-primary-700 transition group-hover:text-primary-800">
          Open
        </span>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  return withRequestPerformanceTrace(
    "route:/dashboard",
    {
      routeKind: "overview",
    },
    async () => {
  const { userId, session } = await traceServerStep(
    "dashboard.requireSession",
    () => requireSession(routes.dashboard),
  );

  const [purchases, totalDownloads, learningProfile] = await Promise.all([
    traceServerStep("dashboard.getUserPurchases", () => getUserPurchases(userId)),
    traceServerStep("dashboard.getUserDownloadCount", () => getUserDownloadCount(userId)),
    traceServerStep("dashboard.getUserLearningProfile", () => getUserLearningProfile(userId)),
  ]);
  const ownedResourceIds = purchases.map((purchase) => purchase.resource.id);
  const topCategoryIds = learningProfile.topCategories.map((category) => category.id);
  const primaryLevel = learningProfile.preferredLevels[0];
  const { recommended, newInCategories, levelRecommendations } =
    await traceServerStep(
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
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-h2 font-semibold tracking-tight text-neutral-900">
            Welcome back, {firstName}
          </h1>
          <p className="max-w-2xl text-small leading-6 text-neutral-500">
            Your dashboard keeps recent activity, saved resources, and the next useful pick in
            one place.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
          <div className="h-full rounded-xl border border-surface-200 bg-white px-5 py-4 sm:px-6">
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

          <aside className="flex h-full flex-col justify-between rounded-xl border border-surface-200 bg-white px-5 py-3.5 sm:px-6">
            <div className="space-y-1">
              <p className="text-caption font-semibold text-zinc-500">Plan</p>
              <h2 className="text-base font-semibold text-zinc-900">
                {isSubscribed ? "Pro membership is active" : "Upgrade when you need more"}
              </h2>
              <p className="text-small leading-6 text-zinc-500">
                {isSubscribed
                  ? "You already have full access to your dashboard workspace and repeat downloads."
                  : "Unlock unlimited resources and a faster path back into your study workflow."}
              </p>
            </div>
            {!isSubscribed ? (
              <Link
                href={routes.subscription}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-small font-medium text-primary-700 transition hover:bg-primary-100"
              >
                View plans
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 sm:px-6">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-neutral-900">
                Recently added to your library
              </h2>
              <p className="text-small text-neutral-500">
                Jump back into the resources you picked up most recently.
              </p>
            </div>
            <Link
              href={routes.library}
              className="inline-flex items-center gap-1.5 text-small font-medium text-primary-700 transition hover:text-primary-800"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-11 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-50">
                <BookOpen className="h-5 w-5 text-neutral-300" />
              </div>
              <p className="mt-3 text-small font-medium text-neutral-600">
                No resources yet
              </p>
              <p className="mt-1 max-w-sm text-caption text-neutral-400">
                Browse the marketplace to find your first resource and start building your
                workspace.
              </p>
              <Link
                href={routes.marketplace}
                className="mt-4 rounded-xl bg-neutral-900 px-4 py-2.5 text-small font-semibold text-white hover:bg-neutral-800"
              >
                Browse marketplace
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-surface-200">
              {recentPurchases.map((purchase) => (
                <li key={purchase.id}>
                  <Link
                    href={routes.resource(purchase.resource.slug)}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-50/70 sm:px-6"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-200 bg-surface-50">
                      {purchase.resource.previewUrl ? (
                        <Image
                          src={purchase.resource.previewUrl}
                          alt={purchase.resource.title}
                          width={44}
                          height={44}
                          sizes="44px"
                          className="h-11 w-11 rounded-xl object-cover"
                        />
                      ) : (
                        <FileText className="h-5 w-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-small font-medium text-neutral-900">
                        {purchase.resource.title}
                      </p>
                      <p className="mt-0.5 text-caption text-neutral-400">
                        {purchase.resource.author?.name ?? "Unknown"} · {formatDate(purchase.createdAt)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-small font-semibold text-neutral-500">
                      {purchase.resource.isFree
                        ? "Free"
                        : formatPrice(purchase.resource.price / 100)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-xl border border-surface-200 bg-white px-5 py-4 sm:px-6">
          <div className="space-y-4">
            {lastOpened && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-caption font-semibold text-zinc-500">
                    Continue
                  </p>
                  <p className="text-small font-semibold text-zinc-900">
                    Pick up where you left off
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-200 bg-surface-50">
                    {lastOpened.resource.previewUrl ? (
                      <Image
                        src={lastOpened.resource.previewUrl}
                        alt={lastOpened.resource.title}
                        width={44}
                        height={44}
                        sizes="44px"
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-semibold text-neutral-900">
                      {lastOpened.resource.title}
                    </p>
                    <p className="mt-0.5 text-caption text-neutral-400">
                      {lastOpened.resource.author?.name ?? "Unknown"}
                    </p>
                  </div>
                </div>
                <Link
                  href={routes.resource(lastOpened.resource.slug)}
                  className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-small font-medium text-neutral-700 transition hover:bg-white"
                >
                  <BookOpen className="h-4 w-4" />
                  Open resource
                </Link>
              </div>
            )}

            {nextBestAction && (
              <div className="space-y-3 border-t border-surface-200 pt-4">
                <div className="space-y-1">
                  <p className="text-caption font-semibold text-zinc-500">
                    Next up
                  </p>
                  <p className="text-small font-semibold text-zinc-900">
                    {becauseYouPickedUp
                      ? `Because you picked up ${becauseYouPickedUp}`
                      : continueLearningCategory
                        ? `Keep learning in ${continueLearningCategory}`
                        : "Pick your next resource while momentum is high"}
                  </p>
                </div>
                <p className="text-small leading-6 text-neutral-500">
                  {nextBestAction.author?.name ? `${nextBestAction.author.name} · ` : ""}
                  {nextBestAction.isFree
                    ? "Free to add to your library"
                    : `${formatPrice(nextBestAction.price / 100)} · Ready when you are`}
                </p>
                {levelLabel && (
                  <p className="text-caption font-medium text-neutral-500">
                    Recommended for your {levelLabel.toLowerCase()} study flow
                  </p>
                )}
                <Link
                  href={routes.resource(nextBestAction.slug)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-small font-semibold text-white transition hover:bg-primary-700"
                >
                  Explore this next
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <div className="space-y-2 border-t border-surface-200 pt-4">
              <p className="text-caption font-semibold text-zinc-500">Quick links</p>
              <div className="space-y-1">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-small font-medium text-neutral-600 transition hover:bg-surface-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-neutral-400" />
                        {link.label}
                      </div>
                      {link.count !== null ? (
                        <span className="rounded-full bg-surface-100 px-2 py-0.5 text-caption font-semibold text-neutral-500">
                          {link.count}
                        </span>
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </section>

      {recommended.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-neutral-900">
                Start with these picks
              </h2>
              <p className="max-w-2xl text-small text-neutral-500">
                {becauseYouPickedUp
                  ? `Because you picked up ${becauseYouPickedUp}, these are the strongest next resources to open or save next.`
                  : continueLearningCategory
                    ? `Fresh picks in and around ${continueLearningCategory} so you can keep building your library without starting from scratch.`
                    : "Fresh picks based on what you already own."}
              </p>
            </div>
            <Link
              href={routes.marketplace}
              className="text-small font-medium text-primary-700 transition hover:text-primary-800"
            >
              See all
            </Link>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-2">
            {recommended.map((resource) => (
              <DashboardShelfCard
                key={resource.id}
                resource={resource}
                widthClassName="w-[198px]"
              />
            ))}
          </div>
        </section>
      )}

      {newInCategories.length > 0 && multiCategoryLabel.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-neutral-900">
                {multiCategoryLabel.length === 1
                  ? `New in ${multiCategoryLabel[0]}`
                  : "New in your categories"}
              </h2>
              <p className="max-w-2xl text-small text-neutral-500">
                {multiCategoryLabel.length === 1
                  ? `Newer releases in ${multiCategoryLabel[0]} so your next session starts with familiar context.`
                  : `Fresh releases across ${multiCategoryLabel.slice(0, 2).join(" and ")} so coming back feels tailored instead of random.`}
              </p>
            </div>
            <Link
              href={routes.marketplace}
              className="text-small font-medium text-primary-700 transition hover:text-primary-800"
            >
              Browse more
            </Link>
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))]">
            {newInCategories.map((resource) => (
              <DashboardShelfCard
                key={resource.id}
                resource={resource}
                widthClassName="w-full"
                meta={`${resource.author?.name ?? "Unknown"} · ${formatDate(resource.createdAt)}`}
              />
            ))}
          </div>
        </section>
      )}

      {levelRecommendations.length > 0 && levelLabel && (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-neutral-900">
                Recommended for your level
              </h2>
              <p className="max-w-2xl text-small text-neutral-500">
                Because your recent library leans {levelLabel.toLowerCase()}, these picks should
                feel closer to your current pace.
              </p>
            </div>
            <Link
              href={routes.marketplace}
              className="text-small font-medium text-primary-700 transition hover:text-primary-800"
            >
              See more
            </Link>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-2">
            {levelRecommendations.map((resource) => (
              <DashboardShelfCard
                key={resource.id}
                resource={resource}
                widthClassName="w-[204px]"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
    },
  );
}
