import { Suspense } from "react";
import { getCreatorActivationFunnel } from "@/services/analytics";
import { ArrowRight, Users, MousePointerClick, FilePlus, Rocket } from "lucide-react";
import { AdminAnalyticsCreatorActivationResultsSkeleton } from "@/components/skeletons/AdminAnalyticsRouteSkeletons";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Creator Activation Funnel – Admin",
  description: "Onboarding funnel from first-run view to first published resource.",
};

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(2)}%`;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Date preset buttons ───────────────────────────────────────────────────────

const PRESETS = [
  { label: "Last 7 days", start: () => daysAgo(7), end: today },
  { label: "Last 30 days", start: () => daysAgo(30), end: today },
  { label: "Last 90 days", start: () => daysAgo(90), end: today },
  { label: "All time", start: () => "", end: () => "" },
] as const;

function PresetButtons({ start, end }: { start: string | null; end: string | null }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => {
        const pStart = p.start();
        const pEnd = p.end();
        const href =
          pStart || pEnd
            ? routes.adminCreatorActivationQuery(`start=${pStart}&end=${pEnd}`)
            : routes.adminCreatorActivation;
        const isActive =
          p.label === "All time"
            ? !start && !end
            : start === pStart && end === pEnd;
        return (
          <a
            key={p.label}
            href={href}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {p.label}
          </a>
        );
      })}
    </div>
  );
}

// ── Funnel step card ──────────────────────────────────────────────────────────

function FunnelStep({
  step,
  label,
  description,
  count,
  conversionFromPrev,
  icon: Icon,
  accent,
  isLast,
}: {
  step: number;
  label: string;
  description: string;
  count: number;
  conversionFromPrev: number | null;
  icon: React.ElementType;
  accent: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
      {/* Card */}
      <div className="flex-1 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Step {step}
          </span>
        </div>
        <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{fmt(count)}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Arrow + conversion rate */}
      {!isLast && (
        <div className="flex items-center justify-center md:flex-col md:py-2">
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="hidden h-5 w-5 text-muted-foreground/40 md:block" />
            <div className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1">
              <span className="text-xs font-semibold tabular-nums text-secondary-foreground">
                {fmtPct(conversionFromPrev)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CreatorActivationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const start = params.start || null;
  const end = params.end || null;
  const fallbackRangeLabel =
    start || end ? `${start || "…"} → ${end || "…"}` : "Last 30 days · default";

  return (
    <div className="space-y-8 px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Creator Activation Funnel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unique creators at each onboarding milestone — from first-run view to first published
            resource.
          </p>
        </div>

        {/* Date range controls */}
        <div className="shrink-0">
          <PresetButtons start={start} end={end} />
          <form method="get" className="mt-2 flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="start"
                className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                From
              </label>
              <input
                id="start"
                name="start"
                type="date"
                defaultValue={start ?? ""}
                className="w-36 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="end"
                className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                To
              </label>
              <input
                id="end"
                name="end"
                type="date"
                defaultValue={end ?? ""}
                className="w-36 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/80"
            >
              Apply
            </button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {fallbackRangeLabel}
          </p>
        </div>
      </div>

      <Suspense fallback={<AdminAnalyticsCreatorActivationResultsSkeleton />}>
        <CreatorActivationResultsSection start={start} end={end} />
      </Suspense>
    </div>
  );
}

async function CreatorActivationResultsSection({
  start,
  end,
}: {
  start: string | null;
  end: string | null;
}) {
  const funnel = await getCreatorActivationFunnel({ start, end });

  const overallRate = funnel.overallRate;
  const summaryTone =
    overallRate === null
      ? "bg-muted border-border text-muted-foreground"
      : overallRate >= 50
        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
        : overallRate >= 20
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-red-50 border-red-200 text-red-700";

  return (
    <>
      <div className={`rounded-2xl border px-6 py-4 ${summaryTone}`}>
        {overallRate === null ? (
          <p className="text-sm font-medium">
            No first-run views recorded yet in this date range. Funnel data will appear once
            approved creators visit their creator dashboard.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-bold tabular-nums">{fmtPct(overallRate)}</span>
            <span className="text-sm font-medium">overall activation rate</span>
            <span className="text-xs opacity-70">
              — {fmt(funnel.firstPublished)} of {fmt(funnel.firstRunViews)} creators who saw
              the first-run dashboard have published their first resource
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Funnel steps · unique creators
        </p>

        <div className="flex flex-col gap-0 md:flex-row md:items-center md:gap-0">
          <FunnelStep
            step={1}
            label="First-run dashboard viewed"
            description="Approved creator visited creator dashboard with 0 published resources."
            count={funnel.firstRunViews}
            conversionFromPrev={funnel.clickRate}
            icon={Users}
            accent="bg-blue-50 text-blue-600"
          />
          <FunnelStep
            step={2}
            label={`Clicked \u201cCreate first resource\u201d`}
            description="Creator navigated to the new resource form for the first time."
            count={funnel.createClicks}
            conversionFromPrev={funnel.draftRate}
            icon={MousePointerClick}
            accent="bg-violet-50 text-violet-600"
          />
          <FunnelStep
            step={3}
            label="First draft saved"
            description="Creator submitted the new resource form and a draft was created."
            count={funnel.draftCreated}
            conversionFromPrev={funnel.publishRate}
            icon={FilePlus}
            accent="bg-amber-50 text-amber-600"
          />
          <FunnelStep
            step={4}
            label="First resource published"
            description="Creator published at least one resource — fully activated."
            count={funnel.firstPublished}
            conversionFromPrev={null}
            icon={Rocket}
            accent="bg-emerald-50 text-emerald-600"
            isLast
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Conversion breakdown
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Transition
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  From
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  To
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  label: "View → Click",
                  from: funnel.firstRunViews,
                  to: funnel.createClicks,
                  rate: funnel.clickRate,
                },
                {
                  label: "Click → Draft",
                  from: funnel.createClicks,
                  to: funnel.draftCreated,
                  rate: funnel.draftRate,
                },
                {
                  label: "Draft → Published",
                  from: funnel.draftCreated,
                  to: funnel.firstPublished,
                  rate: funnel.publishRate,
                },
                {
                  label: "View → Published (overall)",
                  from: funnel.firstRunViews,
                  to: funnel.firstPublished,
                  rate: funnel.overallRate,
                },
              ].map((row) => (
                <tr key={row.label} className="transition-colors hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium text-foreground">{row.label}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{fmt(row.from)}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{fmt(row.to)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {row.rate === null ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.rate >= 50
                            ? "bg-emerald-50 text-emerald-700"
                            : row.rate >= 20
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-600"
                        }`}
                      >
                        {fmtPct(row.rate)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Each row counts distinct creators. A creator is counted at a step only once per
          date range, regardless of how many times they triggered the event.
        </p>
      </div>

      <div className="border-t border-border pt-4 text-[11px] text-muted-foreground">
        Generated at {funnel.generatedAt}
      </div>
    </>
  );
}
