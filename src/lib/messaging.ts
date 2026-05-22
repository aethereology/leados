import "server-only";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { twilioProvider } from "@/lib/providers/twilio";
import { resendProvider } from "@/lib/providers/resend";
import { normalizePhoneNumber, phoneLookupValues } from "@/lib/phone";
import type {
  ConversationChannel,
  Contact,
  Message,
  MessageStatus,
} from "@prisma/client";

export type OutboundResult =
  | { ok: true; message: Message }
  | { ok: false; reason: "no_consent" | "no_destination" | "send_failed"; detail: string };

type SendOutboundInput = {
  tenantId: string;
  contact: Pick<
    Contact,
    "id" | "phone" | "email" | "consentSms" | "consentEmail" | "firstName"
  >;
  channel: Extract<ConversationChannel, "sms" | "email">;
  body: string;
  subject?: string | null;
  userProfileId?: string | null;
};

/**
 * Tenant-scoped outbound send. Owns:
 *   1. consent gating (SMS/email separately)
 *   2. Conversation upsert (unique on tenantId+contactId+channel)
 *   3. Message persistence (queued -> sent | failed | stubbed)
 *   4. Provider dispatch via the adapter layer
 *   5. Audit event + conversation timestamp bump
 *
 * Callers (server actions, workflow dispatch) should never write Conversation
 * or Message rows directly — they go through this helper so consent and audit
 * are enforced consistently.
 */
export async function sendOutboundMessage(input: SendOutboundInput): Promise<OutboundResult> {
  const { tenantId, contact, channel, body, subject, userProfileId } = input;

  // 1. Consent + destination gating
  if (channel === "sms") {
    if (!contact.consentSms) {
      return { ok: false, reason: "no_consent", detail: "Contact has not consented to SMS." };
    }
    if (!contact.phone) {
      return { ok: false, reason: "no_destination", detail: "Contact has no phone number." };
    }
  } else {
    if (!contact.consentEmail) {
      return { ok: false, reason: "no_consent", detail: "Contact has not consented to email." };
    }
    if (!contact.email) {
      return { ok: false, reason: "no_destination", detail: "Contact has no email address." };
    }
  }

  // 2. Conversation upsert
  const conversation = await prisma.conversation.upsert({
    where: {
      tenantId_contactId_channel: {
        tenantId,
        contactId: contact.id,
        channel,
      },
    },
    create: { tenantId, contactId: contact.id, channel },
    update: {},
  });

  // 3. Create the Message row in queued state up front so we always have a record
  const toAddress =
    channel === "sms" ? normalizePhoneNumber(contact.phone!) ?? contact.phone! : contact.email!;
  const queued = await prisma.message.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      direction: "outbound",
      status: "queued",
      body,
      subject: subject ?? null,
      toAddress,
    },
  });

  // 4. Dispatch via the provider adapter
  const twilioAccount =
    channel === "sms"
      ? await prisma.providerAccount.findUnique({
          where: {
            tenantId_provider: {
              tenantId,
              provider: "twilio",
            },
          },
        })
      : null;
  const twilioConfig = twilioAccount?.configJson as { fromNumber?: string } | undefined;
  const twilioFrom =
    twilioAccount?.isActive && twilioConfig?.fromNumber
      ? normalizePhoneNumber(twilioConfig.fromNumber) ?? twilioConfig.fromNumber
      : undefined;
  const sendResult =
    channel === "sms"
      ? await twilioProvider.sendSms({ to: toAddress, body, from: twilioFrom })
      : await resendProvider.sendEmail({
          to: toAddress,
          subject: subject ?? "(no subject)",
          body,
        });

  // 5. Update status + audit + conversation timestamp
  let status: MessageStatus = "sent";
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;

  if (sendResult.status === "sent") {
    status = "sent";
    providerMessageId = sendResult.providerMessageId;
  } else if (sendResult.status === "stubbed") {
    // Provider not configured. Persist the message but flag it so the UI can show
    // "would have sent" rather than pretending it went out.
    status = "queued";
    errorMessage = sendResult.reason;
  } else {
    status = "failed";
    errorMessage = sendResult.errorMessage;
  }

  const updated = await prisma.message.update({
    where: { id: queued.id },
    data: {
      status,
      providerMessageId,
      errorMessage,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: updated.createdAt },
  });

  await createAuditEvent({
    tenantId,
    userProfileId: userProfileId ?? undefined,
    action:
      sendResult.status === "sent"
        ? `message.${channel}.sent`
        : sendResult.status === "stubbed"
          ? `message.${channel}.stubbed`
          : `message.${channel}.failed`,
    targetType: "Message",
    targetId: updated.id,
    metadata: {
      conversationId: conversation.id,
      contactId: contact.id,
      providerMessageId,
      errorMessage,
    },
  });

  if (sendResult.status === "failed") {
    return { ok: false, reason: "send_failed", detail: sendResult.errorMessage };
  }

  return { ok: true, message: updated };
}

/**
 * Records an inbound provider event (SMS reply, inbound email).
 *
 * `fromAddress` is the lookup key — we match the most-recent matching contact
 * in the tenant (E.164 phone for SMS, email for email). If no match, we drop
 * the message (Phase 2 simplification — Phase 3 will create an unknown-sender
 * contact).
 */
export async function recordInboundMessage(input: {
  tenantId: string;
  channel: Extract<ConversationChannel, "sms" | "email">;
  fromAddress: string;
  toAddress?: string | null;
  body: string;
  providerMessageId?: string | null;
  subject?: string | null;
}) {
  const { tenantId, channel, fromAddress, toAddress, body, providerMessageId, subject } = input;
  const normalizedFromAddress =
    channel === "sms" ? normalizePhoneNumber(fromAddress) ?? fromAddress : fromAddress;
  const normalizedToAddress =
    channel === "sms" ? normalizePhoneNumber(toAddress) ?? toAddress : toAddress;

  const contact = await prisma.contact.findFirst({
    where:
      channel === "sms"
        ? { tenantId, phone: { in: phoneLookupValues(fromAddress) } }
        : { tenantId, email: fromAddress },
    orderBy: { updatedAt: "desc" },
  });

  if (!contact) {
    await createAuditEvent({
      tenantId,
      action: `message.${channel}.inbound.unmatched`,
      targetType: "Tenant",
      targetId: tenantId,
      metadata: { fromAddress: normalizedFromAddress, providerMessageId },
    });
    return { matched: false as const };
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      tenantId_contactId_channel: {
        tenantId,
        contactId: contact.id,
        channel,
      },
    },
    create: { tenantId, contactId: contact.id, channel },
    update: {},
  });

  const message = await prisma.message.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      direction: "inbound",
      status: "received",
      body,
      subject: subject ?? null,
      fromAddress: normalizedFromAddress,
      toAddress: normalizedToAddress ?? null,
      providerMessageId: providerMessageId ?? null,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: message.createdAt },
  });

  await createAuditEvent({
    tenantId,
    action: `message.${channel}.inbound`,
    targetType: "Message",
    targetId: message.id,
    metadata: { conversationId: conversation.id, contactId: contact.id, fromAddress: normalizedFromAddress },
  });

  return { matched: true as const, contact, conversation, message };
}

/**
 * Revoke SMS consent for a contact (STOP keyword). Idempotent.
 */
export async function revokeSmsConsent(input: { tenantId: string; phone: string }) {
  const updated = await prisma.contact.updateMany({
    where: { tenantId: input.tenantId, phone: { in: phoneLookupValues(input.phone) } },
    data: { consentSms: false },
  });

  if (updated.count > 0) {
    await createAuditEvent({
      tenantId: input.tenantId,
      action: "contact.sms.unsubscribed",
      targetType: "Contact",
      targetId: input.phone,
      metadata: { reason: "STOP keyword", updatedCount: updated.count },
    });
  }

  return updated.count;
}

/**
 * Lightweight `{{firstName}}`-style substitution for workflow action templates.
 * Missing keys collapse to an empty string. Phase 3 can graduate this to a
 * real template engine if needed.
 */
export function renderTemplate(template: string, vars: Record<string, string | null | undefined>) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null ? "" : String(value);
  });
}
