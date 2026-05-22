import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Twilio outbound status callback (queued -> sent -> delivered -> failed).
 *
 * Maps Twilio's MessageStatus values onto our MessageStatus enum and updates
 * the matching Message row by providerMessageId (Twilio's MessageSid).
 */
function mapTwilioStatus(s: string): "queued" | "sent" | "delivered" | "failed" | null {
  switch (s) {
    case "queued":
    case "accepted":
    case "sending":
      return "queued";
    case "sent":
      return "sent";
    case "delivered":
    case "read":
      return "delivered";
    case "failed":
    case "undelivered":
      return "failed";
    default:
      return null;
  }
}

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

  const sid = String(params.MessageSid ?? "");
  const status = mapTwilioStatus(String(params.MessageStatus ?? ""));
  if (!sid || !status) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await prisma.message.updateMany({
    where: { providerMessageId: sid },
    data: {
      status,
      errorMessage:
        status === "failed" ? String(params.ErrorMessage ?? params.ErrorCode ?? "") || null : null,
    },
  });

  return NextResponse.json({ ok: true });
}
