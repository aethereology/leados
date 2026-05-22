"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess, canWriteTenant } from "@/lib/access";
import { createAuditEvent } from "@/lib/audit";
import { workflowSchema } from "@/lib/zod-schemas";

export type WorkflowFormState = { error?: string };

export async function createWorkflowAction(
  tenantSlug: string,
  _prev: WorkflowFormState | undefined,
  formData: FormData,
): Promise<WorkflowFormState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return { error: "You don't have permission." };

  const parsed = workflowSchema.safeParse({
    name: formData.get("name"),
    triggerType: formData.get("triggerType"),
    actionsJson: formData.get("actionsJson"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  let actions: unknown;
  try {
    actions = JSON.parse(parsed.data.actionsJson);
  } catch {
    return { error: "Actions JSON is not valid JSON." };
  }
  if (!Array.isArray(actions)) {
    return { error: "Actions JSON must be an array." };
  }

  const workflow = await prisma.workflowDefinition.create({
    data: {
      tenantId: tenant.id,
      name: parsed.data.name,
      triggerType: parsed.data.triggerType,
      actionsJson: actions as object,
      isActive: parsed.data.isActive ?? true,
    },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "workflow.create",
    targetType: "WorkflowDefinition",
    targetId: workflow.id,
  });

  revalidatePath(`/app/${tenant.slug}/automations`);
  redirect(`/app/${tenant.slug}/automations`);
}

export async function toggleWorkflowAction(tenantSlug: string, formData: FormData) {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return;

  const id = String(formData.get("id") ?? "");
  const wf = await prisma.workflowDefinition.findFirst({
    where: { id, tenantId: tenant.id },
  });
  if (!wf) return;

  await prisma.workflowDefinition.update({
    where: { id: wf.id },
    data: { isActive: !wf.isActive },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "workflow.toggle",
    targetType: "WorkflowDefinition",
    targetId: wf.id,
    metadata: { isActive: !wf.isActive },
  });

  revalidatePath(`/app/${tenant.slug}/automations`);
}
