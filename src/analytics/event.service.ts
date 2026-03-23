import { type AnalyticsEventType, type Prisma } from "@prisma/client";
import {
  createAnalyticsEvent,
  createManyAnalyticsEvents,
  upsertCreatorRevenue,
} from "@/repositories/analytics/analytics.repository";

export interface RecordAnalyticsEventInput {
  eventType: AnalyticsEventType;
  userId?: string | null;
  resourceId?: string | null;
  creatorId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface RecordPurchaseAnalyticsInput {
  purchaseId: string;
  userId: string;
  resourceId: string;
  creatorId: string;
  amount: number;
  paymentProvider?: string | null;
}

const DEFAULT_PLATFORM_FEE_BPS = 2_000;

function normalizeMetadataValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeMetadataValue(item))
      .filter((item): item is Prisma.InputJsonValue | null => item !== undefined);
  }

  if (typeof value === "object") {
    const normalized: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) continue;
      const resolved = normalizeMetadataValue(entry);
      if (resolved !== undefined) {
        normalized[key] = resolved;
      }
    }

    return normalized;
  }

  return String(value);
}

export function normalizeAnalyticsMetadata(
  metadata?: Record<string, unknown> | null,
): Prisma.InputJsonValue | null {
  if (!metadata) return null;
  return normalizeMetadataValue(metadata);
}

export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
) {
  return createAnalyticsEvent({
    eventType: input.eventType,
    userId: input.userId ?? null,
    resourceId: input.resourceId ?? null,
    creatorId: input.creatorId ?? null,
    metadata: normalizeAnalyticsMetadata(input.metadata),
  });
}

export async function recordAnalyticsEvents(
  inputs: RecordAnalyticsEventInput[],
) {
  if (inputs.length === 0) return;
  return createManyAnalyticsEvents(
    inputs.map((input) => ({
      eventType: input.eventType,
      userId: input.userId ?? null,
      resourceId: input.resourceId ?? null,
      creatorId: input.creatorId ?? null,
      metadata: normalizeAnalyticsMetadata(input.metadata),
    })),
  );
}

export async function recordPurchaseAnalytics(
  input: RecordPurchaseAnalyticsInput,
) {
  const platformFee =
    Math.round((input.amount * DEFAULT_PLATFORM_FEE_BPS) / 10_000);
  const creatorShare = input.amount - platformFee;

  await Promise.all([
    recordAnalyticsEvent({
      eventType: "RESOURCE_PURCHASE",
      userId: input.userId,
      resourceId: input.resourceId,
      creatorId: input.creatorId,
      metadata: {
        purchaseId: input.purchaseId,
        amount: input.amount,
        paymentProvider: input.paymentProvider ?? null,
      },
    }),
    upsertCreatorRevenue({
      creatorId: input.creatorId,
      resourceId: input.resourceId,
      purchaseId: input.purchaseId,
      amount: input.amount,
      platformFee,
      creatorShare,
    }),
  ]);
}
