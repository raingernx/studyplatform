import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface UpsertPendingPurchaseInput {
  userId: string;
  resourceId: string;
  amount: number;
  currency: string;
  paymentProvider: "STRIPE" | "XENDIT";
  authorId: string;
  authorRevenue: number;
  clearXenditInvoiceId?: boolean;
}

export interface PurchaseCompletionResult {
  matched: boolean;
  completed: boolean;
  resourceId: string | null;
}

export interface PurchaseAnalyticsContext {
  purchaseId: string;
  userId: string;
  resourceId: string;
  creatorId: string;
  amount: number;
}

export interface CompleteRecoveredPurchaseInput {
  userId: string;
  resourceId: string;
  amount: number;
  currency: string;
  paymentProvider: "STRIPE" | "XENDIT";
  authorId: string;
  authorRevenue: number;
  stripeSessionId?: string | null;
  xenditInvoiceId?: string | null;
}

export interface UpsertCompletedFreePurchaseInput {
  userId: string;
  resourceId: string;
  authorId: string;
  authorRevenue: number;
}

const PURCHASE_WITH_RESOURCE_INCLUDE = {
  resource: {
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      level: true,
      previewUrl: true,
      isFree: true,
      price: true,
      mimeType: true,
      fileKey: true,
      fileUrl: true,
      downloadCount: true,
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
      previews: { orderBy: { order: "asc" as const }, select: { imageUrl: true } },
    },
  },
} as const;

const PURCHASE_PREFERENCE_SIGNAL_SELECT = {
  createdAt: true,
  resource: {
    select: {
      id: true,
      title: true,
      level: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;

const DOWNLOAD_EVENT_WITH_RESOURCE_SELECT = {
  id: true,
  createdAt: true,
  resource: {
    select: {
      id: true,
      title: true,
      slug: true,
      previewUrl: true,
      fileSize: true,
      type: true,
      price: true,
      isFree: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  },
} as const;

const DOWNLOAD_DEDUP_WINDOW_MS = 60_000;

async function completeMatchedPurchase(
  tx: Prisma.TransactionClient,
  where: Prisma.PurchaseWhereInput,
  data?: Prisma.PurchaseUpdateManyMutationInput,
): Promise<PurchaseCompletionResult> {
  const purchase = await tx.purchase.findFirst({
    where,
    select: { id: true, resourceId: true },
  });

  if (!purchase) {
    return { matched: false, completed: false, resourceId: null };
  }

  const updated = await tx.purchase.updateMany({
    where: {
      id: purchase.id,
      status: { not: "COMPLETED" },
    },
    data: {
      status: "COMPLETED",
      ...(data ?? {}),
    },
  });

  if (updated.count === 0) {
    return { matched: true, completed: false, resourceId: purchase.resourceId };
  }

  return { matched: true, completed: true, resourceId: purchase.resourceId };
}

export async function findPurchaseByUserAndResource(
  userId: string,
  resourceId: string,
) {
  return prisma.purchase.findUnique({
    where: {
      userId_resourceId: {
        userId,
        resourceId,
      },
    },
  });
}

export async function findCompletedPurchaseByUserAndResource(
  userId: string,
  resourceId: string,
) {
  return prisma.purchase.findFirst({
    where: {
      userId,
      resourceId,
      status: "COMPLETED",
    },
    select: { id: true },
  });
}

export async function findCompletedResourceIdsByUser(userId: string) {
  return prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
    select: { resourceId: true },
  });
}

export async function findCompletedResourceIdsByUserFromSet(
  userId: string,
  resourceIds: string[],
) {
  return prisma.purchase.findMany({
    where: {
      userId,
      resourceId: { in: resourceIds },
      status: "COMPLETED",
    },
    select: { resourceId: true },
  });
}

export async function findCompletedSalesCountByResource(resourceId: string) {
  return prisma.purchase.count({
    where: {
      resourceId,
      status: "COMPLETED",
    },
  });
}

export async function findCompletedSalesCountsByResourceIds(resourceIds: string[]) {
  if (resourceIds.length === 0) {
    return [];
  }

  return prisma.purchase.groupBy({
    by: ["resourceId"],
    where: {
      resourceId: { in: resourceIds },
      status: "COMPLETED",
    },
    _count: {
      _all: true,
    },
  });
}

export async function findCompletedPurchasesByUser(userId: string) {
  return prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
    include: PURCHASE_WITH_RESOURCE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function findRecentPurchasePreferenceSignalsByUser(
  userId: string,
  take: number,
) {
  return prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take,
    select: PURCHASE_PREFERENCE_SIGNAL_SELECT,
  });
}

export async function findPurchaseHistoryByUser(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    include: PURCHASE_WITH_RESOURCE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function countDownloadEventsByUser(userId: string) {
  return prisma.downloadEvent.count({
    where: { userId },
  });
}

export async function findDownloadHistoryByUser(userId: string) {
  return prisma.downloadEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: DOWNLOAD_EVENT_WITH_RESOURCE_SELECT,
  });
}

export async function findPurchaseAnalyticsContextByUserAndResource(
  userId: string,
  resourceId: string,
): Promise<PurchaseAnalyticsContext | null> {
  return prisma.purchase.findUnique({
    where: {
      userId_resourceId: {
        userId,
        resourceId,
      },
    },
    select: {
      id: true,
      userId: true,
      resourceId: true,
      amount: true,
      resource: {
        select: {
          authorId: true,
        },
      },
    },
  }).then((purchase) =>
    purchase
      ? {
          purchaseId: purchase.id,
          userId: purchase.userId,
          resourceId: purchase.resourceId,
          creatorId: purchase.resource.authorId,
          amount: purchase.amount,
        }
      : null,
  );
}

export async function findPurchaseAnalyticsContextByStripeSessionId(
  stripeSessionId: string,
): Promise<PurchaseAnalyticsContext | null> {
  return prisma.purchase.findFirst({
    where: { stripeSessionId },
    select: {
      id: true,
      userId: true,
      resourceId: true,
      amount: true,
      resource: {
        select: {
          authorId: true,
        },
      },
    },
  }).then((purchase) =>
    purchase
      ? {
          purchaseId: purchase.id,
          userId: purchase.userId,
          resourceId: purchase.resourceId,
          creatorId: purchase.resource.authorId,
          amount: purchase.amount,
        }
      : null,
  );
}

export async function findPurchaseAnalyticsContextByStripePaymentIntentId(
  stripePaymentIntentId: string,
): Promise<PurchaseAnalyticsContext | null> {
  return prisma.purchase.findFirst({
    where: { stripePaymentIntentId },
    select: {
      id: true,
      userId: true,
      resourceId: true,
      amount: true,
      resource: {
        select: {
          authorId: true,
        },
      },
    },
  }).then((purchase) =>
    purchase
      ? {
          purchaseId: purchase.id,
          userId: purchase.userId,
          resourceId: purchase.resourceId,
          creatorId: purchase.resource.authorId,
          amount: purchase.amount,
        }
      : null,
  );
}

export async function findPurchaseAnalyticsContextByXenditInvoiceId(
  xenditInvoiceId: string,
): Promise<PurchaseAnalyticsContext | null> {
  return prisma.purchase.findFirst({
    where: { xenditInvoiceId },
    select: {
      id: true,
      userId: true,
      resourceId: true,
      amount: true,
      resource: {
        select: {
          authorId: true,
        },
      },
    },
  }).then((purchase) =>
    purchase
      ? {
          purchaseId: purchase.id,
          userId: purchase.userId,
          resourceId: purchase.resourceId,
          creatorId: purchase.resource.authorId,
          amount: purchase.amount,
        }
      : null,
  );
}

export async function upsertPendingPurchase(input: UpsertPendingPurchaseInput) {
  const updateData: {
    amount: number;
    currency: string;
    status: "PENDING";
    paymentProvider: "STRIPE" | "XENDIT";
    authorId: string;
    authorRevenue: number;
    xenditInvoiceId?: null;
  } = {
    amount: input.amount,
    currency: input.currency,
    status: "PENDING",
    paymentProvider: input.paymentProvider,
    authorId: input.authorId,
    authorRevenue: input.authorRevenue,
  };

  if (input.clearXenditInvoiceId) {
    updateData.xenditInvoiceId = null;
  }

  return prisma.purchase.upsert({
    where: {
      userId_resourceId: {
        userId: input.userId,
        resourceId: input.resourceId,
      },
    },
    update: updateData,
    create: {
      userId: input.userId,
      resourceId: input.resourceId,
      amount: input.amount,
      currency: input.currency,
      status: "PENDING",
      paymentProvider: input.paymentProvider,
      authorId: input.authorId,
      authorRevenue: input.authorRevenue,
    },
    select: { id: true },
  });
}

export async function upsertCompletedFreePurchase(
  input: UpsertCompletedFreePurchaseInput,
) {
  return prisma.purchase.upsert({
    where: {
      userId_resourceId: {
        userId: input.userId,
        resourceId: input.resourceId,
      },
    },
    update: {
      amount: 0,
      currency: "usd",
      status: "COMPLETED",
      paymentProvider: "FREE",
      authorId: input.authorId,
      authorRevenue: input.authorRevenue,
    },
    create: {
      userId: input.userId,
      resourceId: input.resourceId,
      amount: 0,
      currency: "usd",
      status: "COMPLETED",
      paymentProvider: "FREE",
      authorId: input.authorId,
      authorRevenue: input.authorRevenue,
    },
    select: { id: true },
  });
}

export async function setPurchaseStripeSessionId(
  purchaseId: string,
  stripeSessionId: string,
) {
  return prisma.purchase.update({
    where: { id: purchaseId },
    data: { stripeSessionId },
  });
}

export async function setPurchaseXenditInvoiceId(
  purchaseId: string,
  xenditInvoiceId: string,
) {
  return prisma.purchase.update({
    where: { id: purchaseId },
    data: { xenditInvoiceId },
  });
}

export async function setPurchaseStripePaymentIntentIdBySession(
  stripeSessionId: string,
  stripePaymentIntentId: string,
) {
  return prisma.purchase.updateMany({
    where: { stripeSessionId },
    data: { stripePaymentIntentId },
  });
}

export async function completeStripePurchaseBySession(
  stripeSessionId: string,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    return completeMatchedPurchase(tx, { stripeSessionId });
  });
}

export async function completeStripePurchaseByPaymentIntent(
  stripePaymentIntentId: string,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    return completeMatchedPurchase(tx, { stripePaymentIntentId });
  });
}

export async function completeXenditPurchaseByInvoiceId(
  xenditInvoiceId: string,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    return completeMatchedPurchase(tx, { xenditInvoiceId });
  });
}

export async function completeXenditPurchaseById(
  purchaseId: string,
  xenditInvoiceId: string | null,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    return completeMatchedPurchase(tx, { id: purchaseId }, xenditInvoiceId ? { xenditInvoiceId } : undefined);
  });
}

export async function completeRecoveredPurchase(
  input: CompleteRecoveredPurchaseInput,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findUnique({
      where: {
        userId_resourceId: {
          userId: input.userId,
          resourceId: input.resourceId,
        },
      },
      select: { id: true, status: true },
    });

    if (existing?.status === "COMPLETED") {
      return { matched: true, completed: false, resourceId: input.resourceId };
    }

    if (existing) {
      await tx.purchase.update({
        where: { id: existing.id },
        data: {
          amount: input.amount,
          currency: input.currency,
          status: "COMPLETED",
          paymentProvider: input.paymentProvider,
          authorId: input.authorId,
          authorRevenue: input.authorRevenue,
          ...(input.stripeSessionId ? { stripeSessionId: input.stripeSessionId } : {}),
          ...(input.xenditInvoiceId ? { xenditInvoiceId: input.xenditInvoiceId } : {}),
        },
      });
    } else {
      await tx.purchase.create({
        data: {
          userId: input.userId,
          resourceId: input.resourceId,
          amount: input.amount,
          currency: input.currency,
          status: "COMPLETED",
          paymentProvider: input.paymentProvider,
          authorId: input.authorId,
          authorRevenue: input.authorRevenue,
          ...(input.stripeSessionId ? { stripeSessionId: input.stripeSessionId } : {}),
          ...(input.xenditInvoiceId ? { xenditInvoiceId: input.xenditInvoiceId } : {}),
        },
      });
    }

    return { matched: Boolean(existing), completed: true, resourceId: input.resourceId };
  });
}

export async function createWebhookDeadLetterEvent(
  provider: "STRIPE" | "XENDIT",
  eventType: string,
  payload: unknown,
) {
  return prisma.webhookEvent.create({
    data: {
      provider,
      eventType,
      payload: JSON.parse(JSON.stringify(payload)),
    },
  });
}

export interface RecordDownloadAnalyticsInput {
  resourceId: string;
  userId: string | null;
  ip: string | null;
}

export async function recordDownloadAnalytics(
  input: RecordDownloadAnalyticsInput,
) {
  const cutoff = new Date(Date.now() - DOWNLOAD_DEDUP_WINDOW_MS);

  await prisma.$transaction(async (tx) => {
    const recentEvent = await tx.downloadEvent.findFirst({
      where: {
        resourceId: input.resourceId,
        createdAt: { gte: cutoff },
        ...(input.userId
          ? { userId: input.userId }
          : input.ip
            ? { ip: input.ip }
            : {}),
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (recentEvent) {
      return;
    }

    await tx.downloadEvent.create({
      data: {
        resourceId: input.resourceId,
        userId: input.userId,
        ip: input.ip,
      },
    });

    await tx.resource.update({
      where: { id: input.resourceId },
      data: { downloadCount: { increment: 1 } },
    });
  });
}
