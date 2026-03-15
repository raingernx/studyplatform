import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
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
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = {
  title: "Purchases – PaperDock",
};

export const dynamic = "force-dynamic";

async function getPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    include: {
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
          previewUrl: true,
          price: true,
          isFree: true,
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

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
    className: "text-zinc-500 bg-zinc-100",
  },
};

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/dashboard/purchases");

  const purchases = await getPurchases(session.user.id);

  const totalSpent = purchases
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-h2 font-semibold tracking-tight text-zinc-900">
              Purchases
            </h1>
            <p className="mt-1 text-[14px] text-zinc-500">
              Your complete order history on PaperDock.
            </p>
          </div>
          {purchases.length > 0 && (
            <div className="hidden flex-col items-end gap-0.5 sm:flex">
              <p className="text-[12px] text-zinc-400">Total spent</p>
              <p className="text-[18px] font-bold tracking-tight text-zinc-900">
                {formatPrice(totalSpent / 100)}
              </p>
            </div>
          )}
        </div>

        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
              <ShoppingBag className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold text-zinc-900">
              No purchases yet
            </h2>
            <p className="mt-1.5 max-w-sm text-[13px] text-zinc-500">
              Browse the marketplace to find and purchase resources.
            </p>
            <Link
              href="/resources"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-zinc-700"
            >
              <BookOpen className="h-4 w-4" />
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_120px_120px_100px] gap-4 border-b border-zinc-100 bg-zinc-50/60 px-6 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Resource
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Creator
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Date
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Amount
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                Status
              </span>
            </div>

            <ul className="divide-y divide-zinc-50">
              {purchases.map((purchase) => {
                const statusCfg =
                  STATUS_CONFIG[purchase.status] ?? STATUS_CONFIG.PENDING;
                const StatusIcon = statusCfg.icon;

                return (
                  <li key={purchase.id}>
                    <div className="grid grid-cols-[2fr_1fr_120px_120px_100px] items-center gap-4 px-6 py-4">
                      {/* Resource */}
                      <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-50">
                          {purchase.resource.previewUrl ? (
                          <Image
                            src={purchase.resource.previewUrl}
                            alt={purchase.resource.title}
                            width={36}
                            height={36}
                            sizes="36px"
                            className="h-9 w-9 rounded-xl object-cover"
                          />
                          ) : (
                            <FileText className="h-4 w-4 text-zinc-300" />
                          )}
                        </div>
                        <Link
                          href={`/resources/${purchase.resource.slug}`}
                          className="group flex min-w-0 items-center gap-1 truncate text-[13px] font-medium text-zinc-900 hover:text-blue-600"
                        >
                          <span className="truncate">
                            {purchase.resource.title}
                          </span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 transition group-hover:opacity-100" />
                        </Link>
                      </div>

                      {/* Creator */}
                      <span className="truncate text-[13px] text-zinc-500">
                        {purchase.resource.author?.name ?? "—"}
                      </span>

                      {/* Date */}
                      <span className="text-[12px] text-zinc-500">
                        {formatDate(purchase.createdAt)}
                      </span>

                      {/* Amount */}
                      <span className="text-[13px] font-semibold">
                        {purchase.resource.isFree ? (
                          <span className="font-medium text-green-600">Free</span>
                        ) : (
                          <span className="text-zinc-800">
                            {formatPrice(purchase.amount / 100)}
                          </span>
                        )}
                      </span>

                      {/* Status */}
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

            {/* Footer summary */}
            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-6 py-3">
              <span className="text-[12px] text-zinc-400">
                {purchases.length} order{purchases.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[13px] font-semibold text-zinc-700">
                Total: {formatPrice(totalSpent / 100)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
