"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { runWorkflowsForTrigger } from "@/lib/workflows";
import { normalizePhoneNumber, phoneLookupValues } from "@/lib/phone";

export type PublicFormState = {
  ok?: boolean;
  error?: string;
  successPayload?: Record<string, string>;
};

/**
 * Public form submission action — runs the full money path:
 *   1. find active form
 *   2. validate required fields
 *   3. upsert contact in correct tenant
 *   4. create FormSubmission
 *   5. create Opportunity in default pipeline + first stage
 *   6. trigger form_submitted workflows -> create WorkflowRun(s)
 *   7. create AuditEvent
 *
 * SECURITY: the only tenant identifier we trust here is the form record itself.
 * The slug -> tenant link is what scopes every other write.
 */
export async function submitPublicFormAction(
  formSlug: string,
  _prev: PublicFormState | undefined,
  formData: FormData,
): Promise<PublicFormState> {
  const form = await prisma.form.findUnique({
    where: { slug: formSlug },
    include: { tenant: true },
  });
  if (!form || !form.isActive) {
    return { error: "This form is no longer accepting submissions." };
  }

  const tenantId = form.tenantId;
  const schema = form.schemaJson as { fields: Array<{ name: string; label: string; type: string; required?: boolean }> };

  const payload: Record<string, string> = {};
  for (const field of schema.fields ?? []) {
    const raw = formData.get(field.name);
    const val = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !val) {
      return { error: `${field.label} is required.` };
    }
    if (val) payload[field.name] = val;
  }

  const email = payload.email?.toLowerCase() || null;
  const phone = normalizePhoneNumber(payload.phone);
  const firstName = payload.firstName || null;
  const lastName = payload.lastName || null;
  const consentSms = formData.get("consentSms") === "on" && !!phone;
  const consentEmail = formData.get("consentEmail") === "on" && !!email;

  const h = headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  // 1. Upsert contact within this tenant: prefer match by email, else phone
  let contact = null as null | Awaited<ReturnType<typeof prisma.contact.findFirst>>;
  if (email) {
    contact = await prisma.contact.findFirst({
      where: { tenantId, email },
    });
  }
  if (!contact && phone) {
    contact = await prisma.contact.findFirst({
      where: { tenantId, phone: { in: phoneLookupValues(phone) } },
    });
  }

  if (contact) {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firstName: contact.firstName ?? firstName ?? undefined,
        lastName: contact.lastName ?? lastName ?? undefined,
        email: contact.email ?? email ?? undefined,
        phone: normalizePhoneNumber(contact.phone) ?? phone ?? undefined,
        source: contact.source ?? form.name,
        tags: Array.from(new Set([...(contact.tags ?? []), "form-lead"])),
        consentSms: contact.consentSms || consentSms,
        consentEmail: contact.consentEmail || consentEmail,
      },
    });
  } else {
    contact = await prisma.contact.create({
      data: {
        tenantId,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        source: form.name,
        tags: ["form-lead"],
        consentSms,
        consentEmail,
      },
    });
  }

  // 2. Persist the submission
  const submission = await prisma.formSubmission.create({
    data: {
      tenantId,
      formId: form.id,
      contactId: contact.id,
      payloadJson: payload,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });

  // 3. Create Opportunity in default pipeline + first stage (if available)
  const pipeline = await prisma.pipeline.findFirst({
    where: { tenantId, isDefault: true },
    include: { stages: { orderBy: { position: "asc" }, take: 1 } },
  });

  let opportunityId: string | null = null;
  if (pipeline && pipeline.stages[0]) {
    const oppTitle =
      [firstName, lastName].filter(Boolean).join(" ") ||
      email ||
      phone ||
      `New lead from ${form.name}`;
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        contactId: contact.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        title: `${oppTitle} – ${form.name}`,
        status: "open",
        source: form.name,
      },
    });
    opportunityId = opportunity.id;
  }

  // 4. Run form_submitted workflows (placeholder execution)
  await runWorkflowsForTrigger("form_submitted", {
    tenantId,
    contactId: contact.id,
    opportunityId,
    formSubmissionId: submission.id,
    payload,
  });

  // 5. Audit event
  await createAuditEvent({
    tenantId,
    action: "form.submission",
    targetType: "FormSubmission",
    targetId: submission.id,
    metadata: {
      formId: form.id,
      contactId: contact.id,
      opportunityId,
    },
  });

  revalidatePath(`/app/${form.tenant.slug}/dashboard`);
  revalidatePath(`/app/${form.tenant.slug}/contacts`);
  revalidatePath(`/app/${form.tenant.slug}/pipeline`);
  revalidatePath(`/app/${form.tenant.slug}/forms/${form.id}`);

  return { ok: true, successPayload: payload };
}
