import { upsertCompletedFreePurchase } from "@/repositories/purchases/purchase.repository";
import { findResourceById } from "@/repositories/resources/resource.repository";

export class LibraryServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Library service error");
    this.status = status;
    this.payload = payload;
  }
}

export async function addFreeResourceToLibrary(userId: string, resourceId: string) {
  const resource = await findResourceById(resourceId);

  if (!resource || resource.status !== "PUBLISHED") {
    throw new LibraryServiceError(404, { error: "Resource not found." });
  }

  if (!resource.isFree) {
    throw new LibraryServiceError(400, {
      error: "This resource requires payment. Please use the checkout flow.",
    });
  }

  await upsertCompletedFreePurchase({
    userId,
    resourceId,
    authorId: resource.authorId,
    authorRevenue: 0,
  });

  return { success: true };
}
