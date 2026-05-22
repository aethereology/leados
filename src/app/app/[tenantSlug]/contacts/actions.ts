"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess, canWriteTenant } from "@/lib/access";
import { createAuditEvent } from "@/lib/audit";
import { contactSchema, messageSendSchema } from "@/lib/zod-schemas";
import { sendOutboundMessage } from "@/lib/messaging";
import { normalizePhoneNumber } from "@/lib/phone";

export type ContactFormState = { error?: string };

export type MessageComposerState = { error?: string; success?: string };

function parseTags(input: string | undefined | null): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function emptyToUndefined(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export async function createContactAction(
  tenantSlug: string,
  _prev: ContactFormState | undefined,
  formData: FormData,
): Promise<ContactFormState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return { error: "You don't have permission to add contacts." };

  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    tags: formData.get("tags"),
    notes: formData.get("notes"),
    consentSms: formData.get("consentSms") === "on",
    consentEmail: formData.get("consentEmail") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const contact = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: emptyToUndefined(parsed.data.firstName ?? null),
      lastName: emptyToUndefined(parsed.data.lastName ?? null),
      email: emptyToUndefined(parsed.data.email ?? null),
      phone: normalizePhoneNumber(parsed.data.phone),
      source: emptyToUndefined(parsed.data.source ?? null) ?? "manual",
      tags: parseTags(parsed.data.tags ?? ""),
      notes: emptyToUndefined(parsed.data.notes ?? null),
      consentSms: !!parsed.data.consentSms,
      consentEmail: !!parsed.data.consentEmail,
    },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "contact.create",
    targetType: "Contact",
    targetId: contact.id,
  });

  revalidatePath(`/app/${tenant.slug}/contacts`);
  revalidatePath(`/app/${tenant.slug}/dashboard`);
  redirect(`/app/${tenant.slug}/contacts/${contact.id}`);
}

export async function updateContactAction(
  tenantSlug: string,
  contactId: string,
  _prev: ContactFormState | undefined,
  formData: FormData,
): Promise<ContactFormState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return { error: "You don't have permission to edit contacts." };

  // verify the contact belongs to this tenant
  const existing = await prisma.contact.findFirst({
    where: { id: contactId, tenantId: tenant.id },
  });
  if (!existing) return { error: "Contact not found." };

  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    tags: formData.get("tags"),
    notes: formData.get("notes"),
    consentSms: formData.get("consentSms") === "on",
    consentEmail: formData.get("consentEmail") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.contact.update({
    where: { id: existing.id },
    data: {
      firstName: emptyToUndefined(parsed.data.firstName ?? null) ?? null,
      lastName: emptyToUndefined(parsed.data.lastName ?? null) ?? null,
      email: emptyToUndefined(parsed.data.email ?? null) ?? null,
      phone: normalizePhoneNumber(parsed.data.phone),
      source: emptyToUndefined(parsed.data.source ?? null) ?? existing.source ?? "manual",
      tags: parseTags(parsed.data.tags ?? ""),
      notes: emptyToUndefined(parsed.data.notes ?? null) ?? null,
      consentSms: !!parsed.data.consentSms,
      consentEmail: !!parsed.data.consentEmail,
    },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "contact.update",
    targetType: "Contact",
    targetId: existing.id,
  });

  revalidatePath(`/app/${tenant.slug}/contacts/${existing.id}`);
  revalidatePath(`/app/${tenant.slug}/contacts`);
  return {};
}

export async function sendContactMessageAction(
  tenantSlug: string,
  contactId: string,
  _prev: MessageComposerState | undefined,
  formData: FormData,
): Promise<MessageComposerState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) {
    return { error: "You don't have permission to send messages." };
  }

  const parsed = messageSendSchema.safeParse({
    channel: formData.get("channel"),
    body: formData.get("body"),
    subject: formData.get("subject"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId: tenant.id },
  });
  if (!contact) return { error: "Contact not found." };

  const result = await sendOutboundMessage({
    tenantId: tenant.id,
    contact,
    channel: parsed.data.channel,
    body: parsed.data.body,
    subject: parsed.data.subject || null,
    userProfileId: profile.id,
  });

  if (!result.ok) {
    return { error: result.detail };
  }

  revalidatePath(`/app/${tenant.slug}/contacts/${contact.id}`);
  revalidatePath(`/app/${tenant.slug}/inbox`);
  return {
    success:
      result.message.status === "sent"
        ? "Message sent."
        : "Message queued — provider not configured yet, but the conversation is recorded.",
  };
}

export async function deleteContactAction(tenantSlug: string, contactId: string) {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return;

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, tenantId: tenant.id },
  });
  if (!existing) return;

  await prisma.contact.delete({ where: { id: existing.id } });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "contact.delete",
    targetType: "Contact",
    targetId: existing.id,
  });

  revalidatePath(`/app/${tenant.slug}/contacts`);
  redirect(`/app/${tenant.slug}/contacts`);
}
