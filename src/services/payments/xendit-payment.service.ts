import { xenditClient } from "@/lib/xendit";
import {
  findPurchaseByUserAndResource,
  setPurchaseXenditInvoiceId,
  upsertPendingPurchase,
} from "@/repositories/purchases/purchase.repository";
import { findResourceById } from "@/repositories/resources/resource.repository";
import { findCheckoutUserById } from "@/repositories/users/user.repository";
import { PaymentServiceError } from "@/services/payments/payment.service";

export async function createXenditCheckout(body: unknown, userId: string) {
  const resourceId =
    typeof body === "object" && body !== null && "resourceId" in body
      ? (body as { resourceId?: string }).resourceId
      : undefined;

  if (!resourceId || typeof resourceId !== "string") {
    throw new PaymentServiceError(400, { error: "resourceId is required." });
  }

  const resource = await findResourceById(resourceId);

  if (!resource) {
    throw new PaymentServiceError(404, { error: "Resource not found." });
  }

  if (resource.isFree || resource.price === 0) {
    throw new PaymentServiceError(400, {
      error: "This resource is free — no checkout needed.",
    });
  }

  const existingPurchase = await findPurchaseByUserAndResource(userId, resourceId);

  if (existingPurchase?.status === "COMPLETED") {
    throw new PaymentServiceError(409, { error: "You already own this resource." });
  }

  const user = await findCheckoutUserById(userId);

  if (!user) {
    throw new PaymentServiceError(404, { error: "User not found." });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const purchase = await upsertPendingPurchase({
    userId,
    resourceId,
    amount: resource.price,
    currency: "thb",
    paymentProvider: "XENDIT",
    clearXenditInvoiceId: true,
  });

  const invoice = await xenditClient.Invoice.createInvoice({
    data: {
      externalId: purchase.id,
      amount: resource.price / 100,
      description: resource.title,
      currency: "THB",
      payerEmail: user.email ?? undefined,
      successRedirectUrl: `${baseUrl}/resources?payment=success`,
      failureRedirectUrl: `${baseUrl}/resources/id/${resourceId}?payment=cancelled`,
      customer: {
        givenNames: user.name ?? undefined,
        email: user.email ?? undefined,
      },
      metadata: {
        userId,
        resourceId,
        purchaseId: purchase.id,
      },
    },
  });

  if (!invoice.id) {
    throw new Error("Xendit invoice id missing.");
  }

  await setPurchaseXenditInvoiceId(purchase.id, invoice.id);

  console.log("[XENDIT CHECKOUT] Invoice created:", {
    purchaseId: purchase.id,
    invoiceId: invoice.id,
    amount: resource.price / 100,
    currency: "THB",
  });

  return { data: { url: invoice.invoiceUrl } };
}
