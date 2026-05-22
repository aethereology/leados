"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess, canWriteTenant } from "@/lib/access";
import { createAuditEvent } from "@/lib/audit";
import { opportunitySchema, opportunityMoveSchema } from "@/lib/zod-schemas";
import { runWorkflowsForTrigger } from "@/lib/workflows";

export type OpportunityFormState = { error?: string };

export async function createOpportunityAction(
  tenantSlug: string,
  _prev: OpportunityFormState | undefined,
  formData: FormData,
): Promise<OpportunityFormState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return { error: "You don't have permission to create opportunities." };

  const parsed = opportunitySchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    pipelineId: formData.get("pipelineId"),
    stageId: formData.get("stageId"),
    value: formData.get("value"),
    status: formData.get("status") ?? "open",
    source: formData.get("source"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  // verify pipeline + stage belong to this tenant
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: parsed.data.stageId, pipelineId: parsed.data.pipelineId, tenantId: tenant.id },
  });
  if (!stage) return { error: "Pipeline stage not found in this workspace." };

  // verify contact (if provided) belongs to this tenant
  let contactId: string | null = null;
  if (parsed.data.contactId && parsed.data.contactId !== "") {
    const contact = await prisma.contact.findFirst({
      where: { id: parsed.data.contactId, tenantId: tenant.id },
    });
    if (!contact) return { error: "Contact does not belong to this workspace." };
    contactId = contact.id;
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      tenantId: tenant.id,
      contactId,
      pipelineId: parsed.data.pipelineId,
      stageId: parsed.data.stageId,
      title: parsed.data.title,
      value: parsed.data.value !== undefined ? String(parsed.data.value) : null,
      status: parsed.data.status ?? "open",
      source: (parsed.data.source as string | undefined) || null,
    },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "opportunity.create",
    targetType: "Opportunity",
    targetId: opportunity.id,
  });

  revalidatePath(`/app/${tenant.slug}/pipeline`);
  revalidatePath(`/app/${tenant.slug}/dashboard`);
  redirect(`/app/${tenant.slug}/pipeline`);
}

export async function moveOpportunityAction(
  tenantSlug: string,
  formData: FormData,
) {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return;

  const parsed = opportunityMoveSchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    stageId: formData.get("stageId"),
  });
  if (!parsed.success) return;

  const opportunity = await prisma.opportunity.findFirst({
    where: { id: parsed.data.opportunityId, tenantId: tenant.id },
    include: { stage: true },
  });
  if (!opportunity) return;

  const newStage = await prisma.pipelineStage.findFirst({
    where: { id: parsed.data.stageId, pipelineId: opportunity.pipelineId, tenantId: tenant.id },
  });
  if (!newStage) return;
  if (newStage.id === opportunity.stageId) return;

  await prisma.opportunity.update({
    where: { id: opportunity.id },
    data: { stageId: newStage.id },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "opportunity.stage_changed",
    targetType: "Opportunity",
    targetId: opportunity.id,
    metadata: {
      from: opportunity.stage.name,
      to: newStage.name,
    },
  });

  await runWorkflowsForTrigger("opportunity_stage_changed", {
    tenantId: tenant.id,
    opportunityId: opportunity.id,
    payload: {
      fromStage: opportunity.stage.name,
      toStage: newStage.name,
    },
  });

  revalidatePath(`/app/${tenant.slug}/pipeline`);
  revalidatePath(`/app/${tenant.slug}/dashboard`);
}
