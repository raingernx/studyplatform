import { Download, ExternalLink, Loader2 } from "lucide-react";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { routes } from "@/lib/routes";

/**
 * Minimal shape of the most recent completed library purchase.
 * Sourced directly from the library page's existing `getLibrary` result —
 * no extra query required.
 */
export interface LastPurchaseItem {
  /** Resource ID — used to build the /api/download/:id URL. */
  id: string;
  slug: string;
  title: string;
  authorName?: string | null;
}

interface LastPurchaseRecoveryProps {
  /**
   * The most recently completed purchase.
   * null  → the webhook has not yet created a COMPLETED purchase row.
   */
  item: LastPurchaseItem | null;
  /**
   * True when the user arrived via ?payment=success but no recent
   * completed purchase exists yet (webhook still processing).
   */
  isPending: boolean;
}

/**
 * Recovery surface rendered at the top of the Library page when a buyer
 * arrives from the checkout success page without a resource slug (Xendit
 * flows and any other provider that drops the slug on redirect).
 *
 * Two render states:
 *   1. Confirmed — a COMPLETED purchase exists; show direct Download + View CTAs.
 *   2. Pending   — no COMPLETED purchase yet; show a "Confirming..." message.
 *
 * Rendered only when ?payment=success is present in the URL.
 * Pure Server Component — no client-side state or effects.
 */
export function LastPurchaseRecovery({
  item,
  isPending,
}: LastPurchaseRecoveryProps) {
  // ── Pending state ──────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Confirming your purchase…
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-amber-700">
            Your payment was received. This usually takes a few seconds — your
            resource will appear here once confirmed. Refresh the page if it
            doesn&apos;t show up shortly.
          </p>
          <a
            href={routes.dashboardV2LibraryPaymentSuccess()}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-[12px] font-semibold text-amber-800 transition hover:bg-amber-200"
          >
            Refresh
          </a>
        </div>
      </div>
    );
  }

  // ── Confirmed recovery block ───────────────────────────────────────────────
  if (!item) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
      {/* Label strip */}
      <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-100 px-5 py-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
          You just purchased
        </p>
      </div>

      {/* Resource row */}
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Resource info */}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {item.title}
          </p>
          {item.authorName && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              by {item.authorName}
            </p>
          )}
          <p className="mt-1 text-[12px] text-emerald-700">
            ✓ Payment confirmed — your file is ready
          </p>
        </div>

        {/* CTAs */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {/* Primary: download directly via the download API */}
          <a
            href={`/api/download/${item.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Download now
          </a>

          {/* Secondary: navigate to the resource page */}
          <ResourceIntentLink
            href={routes.resource(item.slug)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] font-medium text-foreground transition hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            View resource
          </ResourceIntentLink>
        </div>
      </div>
    </div>
  );
}
