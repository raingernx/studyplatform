import { redirect } from "next/navigation";
import Link from "next/link";
import { getRankingDebugReport } from "@/services/analytics/ranking-debug.service";
import { SlidersHorizontal, ExternalLink } from "lucide-react";
import { Button, Input, Select } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TableToolbar } from "@/components/admin/table";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Ranking Debug – Admin",
  description: "Inspect activation-weighted marketplace ranking scores per resource.",
};

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

function fmtScore(n: number) {
  return n.toFixed(4);
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * Colour class for the activation-rate badge.
 * Thresholds are relative to the 0.5 Laplace prior:
 *   ≥ 0.65  → clearly above prior (good signal)
 *   0.45–0.65 → near prior (uncertain)
 *   < 0.45  → below prior (low activation)
 */
function activationTone(rate: number): string {
  if (rate >= 0.65) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (rate >= 0.45) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-red-50 text-red-600 ring-1 ring-red-200";
}

/** Colour class for the recency-boost badge. */
function recencyTone(boost: number): string {
  if (boost >= 0.99) return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  if (boost >= 0.5)  return "bg-blue-50 text-blue-600 ring-1 ring-blue-200";
  return "bg-zinc-100 text-zinc-500";
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Thin horizontal bar that fills proportionally to `value / max`.
 * Used inside each score cell to give a quick visual comparison.
 */
function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className="h-full rounded-full bg-indigo-400 transition-all"
        style={{ width: `${Math.max(pct, 1)}%` }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RankingDebugPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminSession(routes.adminRankingDebug);

  const params = searchParams ? await searchParams : {};
  const category = params.category || "";
  const search   = params.search   || "";
  const price    = params.price    || "";

  const report = await getRankingDebugReport({ category, search, price });

  // Effective active filter count — for display in the header
  const activeFilterCount = [category, search, price].filter(Boolean).length;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <AdminPageHeader
          title="Ranking Debug"
          description="Shows how each published resource scores under the recommended sort formula. Top 50 results. Read-only."
        />

        <div className="shrink-0 rounded-xl border border-border-subtle bg-surface-50 px-5 py-4 text-small text-text-secondary">
          <p className="mb-2 font-ui text-caption text-text-muted">
            Score formula
          </p>
          <p className="font-mono leading-relaxed">
            <span className="text-indigo-600 font-semibold">score</span>
            {" = "}
            <span className="text-violet-600">ln(purchases + 1)</span>
            {" × 0.6"}
            <br />
            {"       + "}
            <span className="text-emerald-600">activation</span>
            {" × 0.3"}
            <br />
            {"       + "}
            <span className="text-blue-600">recency</span>
            {" × 0.1"}
          </p>
          <p className="mt-2 text-caption leading-relaxed text-text-muted">
            activation = (fpd + 3) / (purchases + 6) — Laplace prior 0.500
            <br />
            recency = 1.0 for age &lt; 7 days, else 7 / ageDays
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <section aria-label="Filters">
        <form method="get">
          <TableToolbar className="rounded-xl px-5 py-4">
          {/* Search */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="search"
              className="font-ui text-caption text-text-muted"
            >
              Search title
            </label>
            <Input
              id="search"
              name="search"
              type="text"
              defaultValue={search}
              placeholder="e.g. Math worksheet"
              className="w-full sm:w-56"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="category"
              className="font-ui text-caption text-text-muted"
            >
              Category
            </label>
            <Select
              id="category"
              name="category"
              defaultValue={category}
            >
              <option value="">All categories</option>
              {report.categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="price"
              className="font-ui text-caption text-text-muted"
            >
              Price
            </label>
            <Select
              id="price"
              name="price"
              defaultValue={price}
            >
              <option value="">All</option>
              <option value="free">Free only</option>
              <option value="paid">Paid only</option>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm" className="flex items-center gap-1.5 whitespace-nowrap">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Apply
            </Button>
            {activeFilterCount > 0 && (
              <a
                href={routes.adminRankingDebug}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-50"
              >
                Clear
              </a>
            )}
          </div>

          {/* Active filter indicator */}
          {activeFilterCount > 0 && (
            <p className="flex items-center gap-1.5 font-ui text-caption text-text-muted lg:ml-auto">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-400" />
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              {category && (
                <span className="ml-1 font-medium text-zinc-600">
                  · {report.categories.find((c) => c.slug === category)?.name ?? category}
                </span>
              )}
              {price && (
                <span className="ml-1 font-medium text-zinc-600">
                  · {price}
                </span>
              )}
            </p>
          )}
          </TableToolbar>
        </form>
      </section>

      {/* ── Results table ────────────────────────────────────────────────────── */}
      <section aria-label="Ranking results">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-ui text-caption text-text-muted">
            Results — top {report.rows.length} by score
          </p>
          <p className="text-caption text-text-muted">
            Score range: 0 – {fmtScore(report.maxScore)}
          </p>
        </div>

        {report.rows.length === 0 ? (
          <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center text-small text-text-muted">
            No published resources match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-white">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-50/80">
                  <th className="w-10 px-4 py-3 text-left font-ui text-caption text-text-muted">
                    #
                  </th>
                  <th className="px-5 py-3 text-left font-ui text-caption text-text-muted">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-right font-ui text-caption text-text-muted">
                    Purchases
                  </th>
                  <th className="px-4 py-3 text-right font-ui text-caption text-text-muted">
                    FPD
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-text-muted">
                    Activation
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-text-muted">
                    Recency
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-text-muted">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {report.rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="group transition-colors hover:bg-zinc-50/60"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 font-ui text-caption font-semibold tabular-nums text-text-muted">
                      {i + 1}
                    </td>

                    {/* Title + category */}
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={routes.resource(row.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-zinc-800 hover:text-indigo-600 hover:underline"
                          >
                            {row.title}
                            <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
                          </Link>
                          {row.categoryName && (
                            <p className="mt-0.5 text-caption text-text-muted">
                              {row.categoryName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Raw purchase count */}
                    <td className="px-4 py-3 text-right">
                      <span className="tabular-nums font-semibold text-zinc-900">
                        {fmt(row.purchases)}
                      </span>
                    </td>

                    {/* First paid download count */}
                    <td className="px-4 py-3 text-right">
                      <span
                        title="FIRST_PAID_DOWNLOAD events"
                        className="tabular-nums text-zinc-600"
                      >
                        {fmt(row.fpdCount)}
                      </span>
                    </td>

                    {/* Adjusted activation rate */}
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${activationTone(row.adjActivationRate)}`}
                        title={`(${row.fpdCount} + 3) / (${row.purchases} + 6) = ${row.adjActivationRate.toFixed(4)}`}
                      >
                        {fmtPct(row.adjActivationRate)}
                      </span>
                    </td>

                    {/* Recency boost */}
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${recencyTone(row.recencyBoost)}`}
                        title={`Recency boost = ${row.recencyBoost.toFixed(4)}`}
                      >
                        {row.recencyBoost >= 0.99
                          ? "New"
                          : row.recencyBoost.toFixed(3)}
                      </span>
                    </td>

                    {/* Final score + proportional bar */}
                    <td className="px-5 py-3 text-right">
                      <span className="block tabular-nums font-semibold text-zinc-900">
                        {fmtScore(row.score)}
                      </span>
                      <ScoreBar value={row.score} max={report.maxScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Column legend */}
            <div className="border-t border-border-subtle bg-surface-50/80 px-5 py-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-caption text-text-muted">
                <span>
                  <span className="font-semibold text-zinc-600">FPD</span>
                  {" "}= FIRST_PAID_DOWNLOAD events (unique buyer activations)
                </span>
                <span>
                  <span className="font-semibold text-zinc-600">Activation</span>
                  {" "}= (FPD + 3) / (Purchases + 6) · Laplace prior = 50%
                </span>
                <span>
                  <span className="font-semibold text-zinc-600">Recency</span>
                  {" "}= 1.00 if &lt; 7 days old · &quot;New&quot; badge shown
                </span>
                <span>
                  <span className="font-semibold text-zinc-600">Score</span>
                  {" "}= ln(p+1)×0.6 + activation×0.3 + recency×0.1
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Score weight visualiser ──────────────────────────────────────────── */}
      <section aria-label="Weight breakdown">
        <p className="mb-3 font-ui text-caption text-text-muted">
          Weight breakdown — top 10
        </p>
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-50/80">
                <th className="w-10 px-4 py-3 text-left font-ui text-caption text-text-muted">
                  #
                </th>
                <th className="px-5 py-3 text-left font-ui text-caption text-text-muted">
                  Resource
                </th>
                <th className="px-4 py-3 text-right font-ui text-caption text-violet-500">
                  Volume ×0.6
                </th>
                <th className="px-4 py-3 text-right font-ui text-caption text-emerald-600">
                  Activation ×0.3
                </th>
                <th className="px-4 py-3 text-right font-ui text-caption text-blue-500">
                  Recency ×0.1
                </th>
                <th className="px-5 py-3 text-right font-ui text-caption text-indigo-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {report.rows.slice(0, 10).map((row, i) => {
                const volumeContrib     = Math.log(row.purchases + 1) * 0.6;
                const activationContrib = row.adjActivationRate * 0.3;
                const recencyContrib    = row.recencyBoost * 0.1;

                return (
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-ui text-caption font-semibold tabular-nums text-text-muted">
                      {i + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-800">{row.title}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-violet-700">
                      {volumeContrib.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                      {activationContrib.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-600">
                      {recencyContrib.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold tabular-nums text-zinc-900">
                        {fmtScore(row.score)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-border-subtle bg-surface-50/80 px-5 py-3 text-caption text-text-muted">
            Each column shows its weighted contribution to the total score. Adjust weight
            multipliers in{" "}
            <code className="rounded bg-zinc-200 px-1 font-mono text-zinc-600">
              findActivationRankedResources
            </code>{" "}
            in the repository to re-tune the algorithm.
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-border-subtle pt-4 text-caption text-text-muted">
        Generated at {report.generatedAt} · shows top 50 published resources ·{" "}
        <span className="font-medium text-zinc-600">read-only</span>
      </div>
    </div>
  );
}
