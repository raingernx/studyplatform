import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  FileText,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatPrice } from "@/lib/format";
import { shouldBypassImageOptimizer } from "@/lib/imageDelivery";
import { routes } from "@/lib/routes";
import { getDashboardPurchaseHistoryPageData } from "@/services/admin";
import { getBuildSafePlatformConfig } from "@/services/platform";
import { EmptyState } from "@/design-system";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";

export const metadata = {
  title: "Purchases",
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-50",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "text-amber-600 bg-amber-50",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    className: "text-red-500 bg-red-50",
  },
  REFUNDED: {
    label: "Refunded",
    icon: XCircle,
    className: "bg-secondary text-secondary-foreground",
  },
};

async function PurchasesResultsSection({
  purchases,
}: {
  purchases: Awaited<ReturnType<typeof getDashboardPurchaseHistoryPageData>>;
}) {
  const totalSpent = purchases
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  if (purchases.length === 0) {
    return (
      <EmptyState
        className="bg-card py-20"
        icon={
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
            <ShoppingBag className="h-7 w-7 text-violet-400" />
          </div>
        }
        title="No purchases yet"
        description="Browse the marketplace to find and purchase resources."
        action={
          <Link
            href={routes.marketplace}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition hover:bg-foreground/90"
          >
            <BookOpen className="h-4 w-4" />
            Browse marketplace
          </Link>
        }
      />
    );
  }

  return (
    <DashboardPageStack>
      <div className="hidden flex-col items-end gap-0.5 sm:flex">
        <p className="text-[12px] text-muted-foreground">Total spent</p>
        <p className="text-[18px] font-bold tracking-tight text-foreground">
          {formatPrice(totalSpent / 100)}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-[2fr_1fr_120px_120px_100px] gap-4 border-b border-border bg-muted/70 px-6 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resource
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Creator
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Date
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Amount
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Status
          </span>
        </div>

        <ul className="divide-y divide-border">
          {purchases.map((purchase) => {
            const statusCfg =
              STATUS_CONFIG[purchase.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = statusCfg.icon;

            return (
              <li key={purchase.id}>
                <div className="grid grid-cols-[2fr_1fr_120px_120px_100px] items-center gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {purchase.resource.previewUrl ? (
                        <Image
                          src={purchase.resource.previewUrl}
                          alt={purchase.resource.title}
                          fill
                          sizes="36px"
                          unoptimized={shouldBypassImageOptimizer(
                            purchase.resource.previewUrl,
                          )}
                          className="rounded-xl object-cover"
                        />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                    <ResourceIntentLink
                      href={routes.resource(purchase.resource.slug)}
                      className="group flex min-w-0 items-center gap-1 truncate text-[13px] font-medium text-foreground hover:text-primary-700"
                    >
                      <span className="truncate">
                        {purchase.resource.title}
                      </span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 transition group-hover:opacity-100" />
                    </ResourceIntentLink>
                  </div>

                  <span className="truncate text-[13px] text-muted-foreground">
                    {purchase.resource.author?.name ?? "—"}
                  </span>

                  <span className="text-[12px] text-muted-foreground">
                    {formatDate(purchase.createdAt)}
                  </span>

                  <span className="text-[13px] font-semibold">
                    {purchase.resource.isFree ? (
                      <span className="font-medium text-green-600">Free</span>
                    ) : (
                      <span className="text-foreground">
                        {formatPrice(purchase.amount / 100)}
                      </span>
                    )}
                  </span>

                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCfg.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusCfg.label}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-border bg-muted/70 px-6 py-3">
          <span className="text-[12px] text-muted-foreground">
            {purchases.length} order{purchases.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[13px] font-semibold text-foreground">
            Total: {formatPrice(totalSpent / 100)}
          </span>
        </div>
      </div>
    </DashboardPageStack>
  );
}

export default async function PurchasesPage() {
  const { userId } = await requireSession(routes.purchases);

  const platform = getBuildSafePlatformConfig();
  const purchases = await getDashboardPurchaseHistoryPageData(userId);

  return (
    <DashboardPageShell routeReady="dashboard-purchases">
      <DashboardPageHeader
        title="Purchases"
        description={`Your complete order history on ${platform.platformShortName}.`}
      />
      <PurchasesResultsSection purchases={purchases} />
    </DashboardPageShell>
  );
}
