"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { canWriteTenant, requireTenantAccess } from "@/lib/access";
import { normalizePhoneNumber } from "@/lib/phone";

export async function updateTwilioProviderAction(tenantSlug: string, formData: FormData) {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return;

  const fromNumber = normalizePhoneNumber(String(formData.get("twilioFromNumber") ?? ""));

  if (!fromNumber) {
    await prisma.providerAccount.upsert({
      where: {
        tenantId_provider: {
          tenantId: tenant.id,
          provider: "twilio",
        },
      },
      create: {
        tenantId: tenant.id,
        provider: "twilio",
        isActive: false,
        configJson: {},
      },
      update: {
        isActive: false,
        configJson: {},
      },
    });
  } else {
    await prisma.providerAccount.upsert({
      where: {
        tenantId_provider: {
          tenantId: tenant.id,
          provider: "twilio",
        },
      },
      create: {
        tenantId: tenant.id,
        provider: "twilio",
        isActive: true,
        configJson: { fromNumber },
      },
      update: {
        isActive: true,
        configJson: { fromNumber },
      },
    });
  }

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "provider.twilio.update",
    targetType: "ProviderAccount",
    targetId: tenant.id,
    metadata: { isActive: !!fromNumber },
  });

  revalidatePath(`/app/${tenant.slug}/settings`);
}
