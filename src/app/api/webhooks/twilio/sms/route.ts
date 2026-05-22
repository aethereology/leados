import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { recordInboundMessage, revokeSmsConsent } from "@/lib/messaging";
import { normalizePhoneNumber, phoneLookupValues } from "@/lib/phone";

export const runtime = "nodejs";

/**
 * Inbound SMS webhook for Twilio.
 *
 * Tenant routing: we look up the tenant by `ProviderAccount.provider="twilio"`
 * with a matching `fromNumber` in its `configJson`. Each tenant configures this
 * URL on their Twilio number in the Twilio console.
 *
 * STOP keyword handling: any of STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT
 * revokes consentSms for the matching contact.
 *
 * Signature verification: if TWILIO_AUTH_TOKEN is set, we verify the
 * `x-twilio-signature` header before processing. In local development without
 * a token we accept the request so developers can curl-test the route.
 */
const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  if (env.TWILIO_AUTH_TOKEN) {
    const signature = request.headers.get("x-twilio-signature") ?? "";
    const url = request.nextUrl.toString();
    const valid = twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
    if (!valid) {
      return new NextResponse("Invalid signature", { status: 403 });
    }
  }

  const rawFrom = String(params.From ?? "").trim();
  const rawTo = String(params.To ?? "").trim();
  const from = normalizePhoneNumber(rawFrom) ?? rawFrom;
  const to = normalizePhoneNumber(rawTo) ?? rawTo;
  const body = String(params.Body ?? "");
  const providerMessageId = String(params.MessageSid ?? "") || null;

  if (!from || !to) {
    return new NextResponse("Missing From or To", { status: 400 });
  }

  // Find which tenant owns the destination Twilio number.
  const providerAccount = await prisma.providerAccount.findFirst({
    where: {
      provider: "twilio",
      isActive: true,
      OR: phoneLookupValues(to).map((value) => ({
        configJson: { path: ["fromNumber"], equals: value },
      })),
    },
  });

  if (!providerAccount) {
    // Unknown destination — accept-and-drop so Twilio doesn't keep retrying.
    return new NextResponse("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const tenantId = providerAccount.tenantId;

  if (STOP_KEYWORDS.has(body.trim().toUpperCase())) {
    await revokeSmsConsent({ tenantId, phone: from });
  }

  await recordInboundMessage({
    tenantId,
    channel: "sms",
    fromAddress: from,
    toAddress: to,
    body,
    providerMessageId,
  });

  // Empty TwiML — we don't auto-reply from the webhook.
  return new NextResponse("<Response/>", {
    headers: { "Content-Type": "text/xml" },
  });
}
