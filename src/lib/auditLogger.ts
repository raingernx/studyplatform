import { prisma } from "@/lib/prisma";

export interface AdminAuditLogOptions {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAdminAction({
  adminId,
  action,
  entityType,
  entityId,
  metadata,
}: AdminAuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: entityId ?? undefined,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    // Audit logging must never break primary flows.
    // eslint-disable-next-line no-console
    console.error("[AUDIT_LOG_ERROR]", err);
  }
}

