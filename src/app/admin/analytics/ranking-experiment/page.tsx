import { redirect } from "next/navigation";
import { getRankingExperimentReport } from "@/services/analytics/ranking-experiment.service";
import { type RankingVariantRow } from "@/services/analytics/ranking-experiment.service";
import { SlidersHorizontal, Info } from "lucide-react";
import { Button, Input } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TableToolbar } from "@/components/admin/table";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Ranking Experiment – Admin",
  description:
    "Per-variant funnel metrics for the ranking A/B experiment (A = newest/control, B = recommended/treatment).",
};

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

/**
 * Renders a rate as "12.3% (3 / 25)" when count and denominator are provided,
 * or "—" when the rate is null (zero denominator).
 */
function fmtRate(rate: number | null, numerator: number, denominator: number): string {
  if (rate === null) return "—";
  return `${rate.toFixed(1)}% (${fmt(numerator)} / ${fmt(denominator)})`;
}

/** Colour class applied to rate cells based on thresholds. */
function rateTone(
  rate: number | null,
  thresholdHigh: number,
  thresholdLow: number,
): string {
  if (rate === null) return "text-zinc-400";
  if (rate >= thresholdHigh) return "text-emerald-700 font-semibold";
  if (rate >= thresholdLow) return "text-amber-600 font-semibold";
  return "text-red-600 font-semibold";
}

/** Column header accent class per variant. */
function variantHeaderAccent(variant: string): string {
  if (variant === "B") return "text-indigo-700";
  if (variant === "UNASSIGNED") return "text-zinc-400";
  return "text-zinc-700";
}

/** Column header background per variant. */
function variantHeaderBg(variant: string): string {
  if (variant === "B") return "bg-indigo-50";
  return "bg-zinc-50";
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * A single metric row in the comparison table.
 * `renderCell` receives the full variant row and returns the cell content.
 */
function MetricRow({
  label,
  tooltip,
  variants,
  renderCell,
}: {
  label: string;
  tooltip: string;
  variants: RankingVariantRow[];
  renderCell: (row: RankingVariantRow) => React.ReactNode;
}) {
  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-zinc-800">{label}</span>
          <span
            title={tooltip}
            className="cursor-help text-zinc-300 hover:text-zinc-400"
            aria-label={tooltip}
          >
            <Info className="h-3 w-3" />
          </span>
        </div>
      </td>
      {variants.map((row) => (
        <td
          key={row.variant}
          className="px-5 py-3.5 text-right tabular-nums text-zinc-900"
        >
          {renderCell(row)}
        </td>
      ))}
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RankingExperimentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminSession(routes.adminRankingExperiment);

  const params = searchParams ? await searchParams : {};
  const startParam = params.start ?? "";
  const endParam = params.end ?? "";

  const report = await getRankingExperimentReport({
    start: startParam || null,
    end: endParam || null,
  });

  const hasFilters = Boolean(startParam || endParam);

  // All variants from the service — already ordered A → B → UNASSIGNED.
  // No special null branch needed: UNASSIGNED is a regular variant string.
  const variants = report.variants;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <AdminPageHeader
          title="Ranking Experiment"
          description="Compares buyer-funnel metrics between the baseline newest sort and the recommended activation-weighted variant."
        />

        {/* Arm legend */}
        <div className="shrink-0 rounded-xl border border-border-subtle bg-surface-50 px-5 py-4 text-small text-text-secondary">
          <p className="mb-2 font-ui text-caption text-text-muted">
            Experiment arms
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <span>
                <span className="font-semibold text-zinc-700">A</span>
                {" — Control (Baseline) · sort: newest"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>
                <span className="font-semibold text-indigo-700">B</span>
                {" — Variant (Recommended) · sort: activation-weighted"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-300" />
              <span>
                <span className="font-semibold text-zinc-500">UNASSIGNED</span>
                {" — pre-experiment / missing cookie"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-caption text-text-muted">
            Cookie: <code className="font-mono">ranking_variant</code> · 30-day lifetime
          </p>
        </div>
      </div>

      {/* ── Date range filter ────────────────────────────────────────────────── */}
      <section aria-label="Date range filter">
        <form method="get">
          <TableToolbar className="px-5 py-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="start"
              className="font-ui text-caption text-text-muted"
            >
              From
            </label>
            <Input
              id="start"
              name="start"
              type="date"
              defaultValue={startParam}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="end"
              className="font-ui text-caption text-text-muted"
            >
              To
            </label>
            <Input
              id="end"
              name="end"
              type="date"
              defaultValue={endParam}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" size="sm" className="flex items-center gap-1.5 whitespace-nowrap">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Apply
            </Button>
            {hasFilters && (
              <a
                href={routes.adminRankingExperiment}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-50"
              >
                Reset
              </a>
            )}
          </div>

          <p className="flex items-center gap-1.5 font-ui text-caption text-text-muted lg:ml-auto">
            {report.isDefaultRange
              ? "Showing last 30 days (default)"
              : `${report.filterStart} — ${report.filterEnd}`}
          </p>
          </TableToolbar>
        </form>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <section aria-label="Variant comparison">
        <p className="mb-3 font-ui text-caption text-text-muted">
          Per-variant metrics
        </p>

        {variants.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center text-small text-text-muted">
            No attributed events in this date range. Widen the window or wait for more data.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="min-w-[200px] bg-white px-5 py-3 text-left font-ui text-caption text-text-muted">
                    Metric
                  </th>
                  {variants.map((row) => (
                    <th
                      key={row.variant}
                      className={`px-5 py-3 text-right font-ui text-caption ${variantHeaderBg(row.variant)}`}
                    >
                      <span className={variantHeaderAccent(row.variant)}>
                        {row.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle/60">

                {/* Checkout starts */}
                <MetricRow
                  label="Checkout starts"
                  tooltip="CHECKOUT_STARTED ActivityLog events. Direct attribution — rankingVariant is written into metadata at checkout creation time."
                  variants={variants}
                  renderCell={(r) => fmt(r.checkoutStarts)}
                />

                {/* Checkout redirects */}
                <MetricRow
                  label="Checkout redirects"
                  tooltip="CHECKOUT_REDIRECTED events attributed via 30-minute time-window join from CHECKOUT_STARTED (same userId + resourceId). Indirect attribution."
                  variants={variants}
                  renderCell={(r) => fmt(r.checkoutRedirects)}
                />

                {/* Completed purchases */}
                <MetricRow
                  label="Completed purchases"
                  tooltip="Purchase rows (status = COMPLETED, paid provider) joined from CHECKOUT_STARTED on userId + resourceId. Indirect attribution — PURCHASE_COMPLETED_WEBHOOK fires server-side with no cookie access."
                  variants={variants}
                  renderCell={(r) => fmt(r.completions)}
                />

                {/* Redirect → completion rate */}
                <MetricRow
                  label="Redirect → completion rate"
                  tooltip="Completed purchases / Checkout redirects × 100. Isolates payment provider friction from UI or pricing drop-off. ≥ 80% healthy."
                  variants={variants}
                  renderCell={(r) => (
                    <span className={rateTone(r.redirectToCompletionRate, 80, 60)}>
                      {fmtRate(r.redirectToCompletionRate, r.completions, r.checkoutRedirects)}
                    </span>
                  )}
                />

                {/* Conversion rate */}
                <MetricRow
                  label="Conversion rate"
                  tooltip="Completed purchases / Checkout starts × 100. Combined signal: includes both redirect drop-off and payment drop-off."
                  variants={variants}
                  renderCell={(r) => (
                    <span className={rateTone(r.conversionRate, 10, 5)}>
                      {fmtRate(r.conversionRate, r.completions, r.checkoutStarts)}
                    </span>
                  )}
                />

                {/* FPD count */}
                <MetricRow
                  label="First paid downloads (FPD)"
                  tooltip="FIRST_PAID_DOWNLOAD ActivityLog events. Direct attribution — fires on the first successful paid download per user per resource."
                  variants={variants}
                  renderCell={(r) => fmt(r.fpdCount)}
                />

                {/* Paid activation rate */}
                <MetricRow
                  label="Paid activation rate"
                  tooltip="First paid downloads / Completed purchases × 100. Key health signal: ≥ 85% healthy, 75–85% monitor, < 75% fix activation first."
                  variants={variants}
                  renderCell={(r) => (
                    <span className={rateTone(r.paidActivationRate, 85, 75)}>
                      {fmtRate(r.paidActivationRate, r.fpdCount, r.completions)}
                    </span>
                  )}
                />

              </tbody>
            </table>

            {/* ── Attribution footnotes ──────────────────────────────────────── */}
            <div className="border-t border-border-subtle bg-surface-50/80 px-5 py-4">
              <p className="mb-2 font-ui text-caption text-text-muted">
                Attribution notes
              </p>
              <ul className="space-y-1 text-caption text-text-muted">
                <li>
                  <span className="font-semibold text-zinc-600">Checkout starts, FPD</span>
                  {" — "}
                  <span className="font-medium text-zinc-500">direct:</span>
                  {" these ActivityLog events carry "}
                  <code className="font-mono text-zinc-500">rankingVariant</code>
                  {" in their metadata at write time."}
                </li>
                <li>
                  <span className="font-semibold text-zinc-600">Redirects</span>
                  {" — "}
                  <span className="font-medium text-zinc-500">inferred:</span>
                  {" CHECKOUT_REDIRECTED is fired client-side with no cookie access. Attributed by joining to the CHECKOUT_STARTED event for the same user + resource within a 30-minute window."}
                </li>
                <li>
                  <span className="font-semibold text-zinc-600">Completions</span>
                  {" — "}
                  <span className="font-medium text-zinc-500">inferred:</span>
                  {" PURCHASE_COMPLETED_WEBHOOK fires on payment provider servers with no browser session. Attributed by joining Purchase rows to CHECKOUT_STARTED on userId + resourceId."}
                </li>
                <li>
                  <span className="font-semibold text-zinc-600">Unassigned / Legacy</span>
                  {" — includes: (1) users whose cookie had not yet been assigned on first page load, (2) pre-experiment sessions before the cookie was introduced, (3) sessions where the cookie read failed silently. Not an error state."}
                </li>
                <li>
                  <span className="font-semibold text-zinc-600">Cross-variant rule:</span>
                  {" completions and redirects are always attributed to the variant in the CHECKOUT_STARTED event — never back-assigned from the FIRST_PAID_DOWNLOAD variant."}
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-border-subtle pt-4 text-caption text-text-muted">
        Generated at {report.generatedAt} ·{" "}
        {report.isDefaultRange
          ? "last 30 days"
          : `${report.filterStart} – ${report.filterEnd}`}{" "}
        · <span className="font-medium text-zinc-600">read-only</span>{" "}
        · no effect on live rankings
      </div>
    </div>
  );
}
