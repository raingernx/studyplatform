import { prisma } from "@/lib/prisma";

export interface UpsertPendingPurchaseInput {
  userId: string;
  resourceId: string;
  amount: number;
  currency: string;
  paymentProvider: "STRIPE" | "XENDIT";
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
  stripeSessionId?: string | null;
  xenditInvoiceId?: string | null;
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
    status: "PENDING";
    paymentProvider: "STRIPE" | "XENDIT";
    xenditInvoiceId?: null;
  } = {
    status: "PENDING",
    paymentProvider: input.paymentProvider,
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
    const purchase = await tx.purchase.findFirst({
      where: { stripeSessionId },
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
      data: { status: "COMPLETED" },
    });

    if (updated.count === 0) {
      return { matched: true, completed: false, resourceId: purchase.resourceId };
    }

    await tx.resource.update({
      where: { id: purchase.resourceId },
      data: { downloadCount: { increment: 1 } },
    });

    return { matched: true, completed: true, resourceId: purchase.resourceId };
  });
}

export async function completeStripePurchaseByPaymentIntent(
  stripePaymentIntentId: string,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: { stripePaymentIntentId },
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
      data: { status: "COMPLETED" },
    });

    if (updated.count === 0) {
      return { matched: true, completed: false, resourceId: purchase.resourceId };
    }

    await tx.resource.update({
      where: { id: purchase.resourceId },
      data: { downloadCount: { increment: 1 } },
    });

    return { matched: true, completed: true, resourceId: purchase.resourceId };
  });
}

export async function completeXenditPurchaseByInvoiceId(
  xenditInvoiceId: string,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: { xenditInvoiceId },
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
      data: { status: "COMPLETED" },
    });

    if (updated.count === 0) {
      return { matched: true, completed: false, resourceId: purchase.resourceId };
    }

    await tx.resource.update({
      where: { id: purchase.resourceId },
      data: { downloadCount: { increment: 1 } },
    });

    return { matched: true, completed: true, resourceId: purchase.resourceId };
  });
}

export async function completeXenditPurchaseById(
  purchaseId: string,
  xenditInvoiceId: string | null,
): Promise<PurchaseCompletionResult> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
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
        ...(xenditInvoiceId ? { xenditInvoiceId } : {}),
      },
    });

    if (updated.count === 0) {
      return { matched: true, completed: false, resourceId: purchase.resourceId };
    }

    await tx.resource.update({
      where: { id: purchase.resourceId },
      data: { downloadCount: { increment: 1 } },
    });

    return { matched: true, completed: true, resourceId: purchase.resourceId };
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
          ...(input.stripeSessionId ? { stripeSessionId: input.stripeSessionId } : {}),
          ...(input.xenditInvoiceId ? { xenditInvoiceId: input.xenditInvoiceId } : {}),
        },
      });
    }

    await tx.resource.update({
      where: { id: input.resourceId },
      data: { downloadCount: { increment: 1 } },
    });

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
  await Promise.all([
    prisma.resource.update({
      where: { id: input.resourceId },
      data: { downloadCount: { increment: 1 } },
    }),
    prisma.downloadEvent.create({
      data: {
        resourceId: input.resourceId,
        userId: input.userId,
        ip: input.ip,
      },
    }),
  ]);
}
