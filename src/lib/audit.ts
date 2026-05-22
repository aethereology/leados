import "server-only";
import { prisma } from "@/lib/prisma";

export type AuditEventInput = {
  action: string;
  tenantId?: string | null;
  agencyId?: string | null;
  userProfileId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Records an audit event. Always called fire-and-forget style — never let an
 * audit write break a primary action. Callers should still `await` to surface
 * failures in logs during Phase 1.
 */
export async function createAuditEvent(input: AuditEventInput) {
  try {
    return await prisma.auditEvent.create({
      data: {
        action: input.action,
        tenantId: input.tenantId ?? undefined,
        agencyId: input.agencyId ?? undefined,
        userProfileId: input.userProfileId ?? undefined,
        targetType: input.targetType ?? undefined,
        targetId: input.targetId ?? undefined,
        metadataJson: (input.metadata ?? undefined) as object | undefined,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("createAuditEvent failed", err);
    return null;
  }
}
