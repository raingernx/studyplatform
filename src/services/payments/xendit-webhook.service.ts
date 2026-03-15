import { verifyXenditWebhook } from "@/lib/xendit";
import {
  completeRecoveredPurchase,
  completeXenditPurchaseById,
  completeXenditPurchaseByInvoiceId,
  createWebhookDeadLetterEvent,
  findPurchaseAnalyticsContextByUserAndResource,
  findPurchaseAnalyticsContextByXenditInvoiceId,
  findPurchaseByUserAndResource,
} from "@/repositories/purchases/purchase.repository";
import { recordPurchaseAnalytics } from "@/analytics/event.service";
import { PaymentServiceError } from "@/services/payments/payment.service";

interface XenditInvoicePayload {
  id?: string;
  external_id?: string;
  status?: "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  amount?: number;
  paid_amount?: number;
  currency?: string;
  metadata?: {
    userId?: string;
    resourceId?: string;
    purchaseId?: string;
    [key: string]: string | undefined;
  };
}

export function assertValidXenditWebhookToken(token: string | null) {
  if (!verifyXenditWebhook(token)) {
    throw new PaymentServiceError(401, { error: "Unauthorized" });
  }
}

export async function handleXenditWebhookPayload(payload: unknown) {
  const invoice = payload as XenditInvoicePayload;
  const isPaid =
    invoice.status === "PAID" || invoice.status === "SETTLED";

  if (!isPaid) {
    return;
  }

  const invoiceId = invoice.id ?? null;
  const purchaseId = invoice.metadata?.purchaseId ?? invoice.external_id ?? null;
  const userId = invoice.metadata?.userId ?? null;
  const resourceId = invoice.metadata?.resourceId ?? null;

  if (invoiceId) {
    const byInvoice = await completeXenditPurchaseByInvoiceId(invoiceId);
    if (byInvoice.matched) {
      if (byInvoice.completed) {
        await recordXenditPurchaseAnalytics({
          invoiceId,
          userId,
          resourceId,
        });
      }
      return;
    }
  }

  if (purchaseId) {
    const byPurchaseId = await completeXenditPurchaseById(purchaseId, invoiceId);
    if (byPurchaseId.matched) {
      if (byPurchaseId.completed) {
        await recordXenditPurchaseAnalytics({
          invoiceId,
          userId,
          resourceId,
        });
      }
      return;
    }
  }

  if (!userId || !resourceId) {
    console.error("[XENDIT WEBHOOK] Recovery failed - missing userId/resourceId.", {
      invoiceId,
      purchaseId,
      metadata: invoice.metadata,
    });

    await createWebhookDeadLetterEvent("XENDIT", "invoice.paid", invoice).catch(
      (error) =>
        console.warn(
          "[XENDIT WEBHOOK] Failed to store dead-letter event:",
          error,
        ),
    );

    return;
  }

  const existingPurchase = await findPurchaseByUserAndResource(userId, resourceId);

  if (existingPurchase?.status === "COMPLETED") {
    return;
  }

  const recovered = await completeRecoveredPurchase({
    userId,
    resourceId,
    amount: invoice.paid_amount ?? invoice.amount ?? 0,
    currency: (invoice.currency ?? "thb").toLowerCase(),
    paymentProvider: "XENDIT",
    xenditInvoiceId: invoiceId,
  });

  if (recovered.completed) {
    await recordXenditPurchaseAnalytics({
      invoiceId,
      userId,
      resourceId,
    });
  }
}

interface XenditPurchaseAnalyticsInput {
  invoiceId: string | null;
  userId: string | null;
  resourceId: string | null;
}

async function recordXenditPurchaseAnalytics(
  input: XenditPurchaseAnalyticsInput,
) {
  const context =
    (input.invoiceId
      ? await findPurchaseAnalyticsContextByXenditInvoiceId(input.invoiceId)
      : null) ??
    (input.userId && input.resourceId
      ? await findPurchaseAnalyticsContextByUserAndResource(
          input.userId,
          input.resourceId,
        )
      : null);

  if (!context) {
    return;
  }

  await recordPurchaseAnalytics({
    purchaseId: context.purchaseId,
    userId: context.userId,
    resourceId: context.resourceId,
    creatorId: context.creatorId,
    amount: context.amount,
    paymentProvider: "XENDIT",
  }).catch((error) => {
    console.error("[XENDIT WEBHOOK] Failed to record purchase analytics:", error);
  });
}
