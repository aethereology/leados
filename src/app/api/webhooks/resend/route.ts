import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Resend event webhook — receives outbound delivery events
 * (email.sent, email.delivered, email.bounced, email.complained, email.failed).
 *
 * We update the Message row by providerMessageId (Resend's email id).
 *
 * Signature verification: Resend uses Svix signatures. We fail closed if the
 * webhook secret is missing so unsigned requests can never mutate message
 * delivery state in production.
 */

type ResendEvent = {
  type?: string;
  data?: {
    email_id?: string;
    [k: string]: unknown;
  };
};

function mapResendEvent(type: string): {
  status: "sent" | "delivered" | "failed" | null;
  errorOverride?: string;
} {
  switch (type) {
    case "email.sent":
      return { status: "sent" };
    case "email.delivered":
      return { status: "delivered" };
    case "email.bounced":
      return { status: "failed", errorOverride: "bounced" };
    case "email.complained":
      return { status: "failed", errorOverride: "spam complaint" };
    case "email.failed":
    case "email.delivery_delayed":
      return { status: "failed" };
    default:
      return { status: null };
  }
}

export async function POST(request: NextRequest) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "resend_webhook_not_configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  let payload: ResendEvent;
  try {
    payload = new Webhook(env.RESEND_WEBHOOK_SECRET).verify(rawBody, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    }) as ResendEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 403 });
  }

  const emailId = payload.data?.email_id;
  const eventType = payload.type ?? "";
  if (!emailId || !eventType) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { status, errorOverride } = mapResendEvent(eventType);
  if (!status) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  await prisma.message.updateMany({
    where: { providerMessageId: emailId },
    data: {
      status,
      errorMessage: errorOverride ?? (status === "failed" ? eventType : null),
    },
  });

  return NextResponse.json({ ok: true });
}
