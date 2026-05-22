import "server-only";
import twilio from "twilio";
import { env, isTwilioConfigured } from "@/lib/env";
import type { SmsProvider, SendResult } from "./types";

let cachedClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return cachedClient;
}

export const twilioProvider: SmsProvider = {
  name: "twilio",
  get isConfigured() {
    return isTwilioConfigured();
  },
  async sendSms({ to, body, from }): Promise<SendResult> {
    if (!isTwilioConfigured()) {
      return {
        status: "stubbed",
        reason:
          "Twilio not configured — need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and one of TWILIO_FROM_NUMBER / TWILIO_MESSAGING_SERVICE_SID",
      };
    }

    try {
      const message = await getClient().messages.create({
        to,
        body,
        ...(from
          ? { from }
          : env.TWILIO_MESSAGING_SERVICE_SID
            ? { messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID }
            : { from: env.TWILIO_FROM_NUMBER! }),
      });
      return { status: "sent", providerMessageId: message.sid };
    } catch (err) {
      return {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
