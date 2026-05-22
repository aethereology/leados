"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireUserProfile,
  getAccessibleTenants,
  canManageAgency,
} from "@/lib/access";
import { installBlueprintForTenant } from "@/lib/blueprints";

export type InstallState = {
  error?: string;
  alreadyInstalled?: boolean;
  ok?: boolean;
  installedTenantSlug?: string;
};

export async function installBlueprintAction(
  blueprintId: string,
  _prev: InstallState | undefined,
  formData: FormData,
): Promise<InstallState> {
  const profile = await requireUserProfile();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return { error: "Pick a workspace to install into." };

  // Verify the user has access to this tenant via membership
  const tenants = await getAccessibleTenants(profile.id);
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) return { error: "You don't have access to that workspace." };

  // Only agency admins/owners (or super admins) can install
  const membership = await prisma.membership.findFirst({
    where: {
      userProfileId: profile.id,
      OR: [{ agencyId: tenant.agencyId }, { tenantId: tenant.id }],
    },
  });
  if (!canManageAgency(membership) && membership?.role !== "tenant_admin") {
    return { error: "You don't have permission to install blueprints." };
  }

  try {
    const result = await installBlueprintForTenant({
      blueprintId,
      tenantId: tenant.id,
      userProfileId: profile.id,
    });
    if (result.alreadyInstalled) {
      return { alreadyInstalled: true, installedTenantSlug: tenant.slug };
    }
    revalidatePath(`/app/${tenant.slug}/pipeline`);
    revalidatePath(`/app/${tenant.slug}/forms`);
    revalidatePath(`/app/${tenant.slug}/automations`);
    revalidatePath(`/app/blueprints/${blueprintId}`);
    return { ok: true, installedTenantSlug: tenant.slug };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
