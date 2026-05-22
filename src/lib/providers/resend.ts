import "server-only";
import { Resend } from "resend";
import { env, isResendConfigured } from "@/lib/env";
import type { EmailProvider, SendResult } from "./types";

let cachedClient: Resend | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new Resend(env.RESEND_API_KEY!);
  return cachedClient;
}

export const resendProvider: EmailProvider = {
  name: "resend",
  get isConfigured() {
    return isResendConfigured();
  },
  async sendEmail({ to, subject, body, from }): Promise<SendResult> {
    if (!isResendConfigured()) {
      return {
        status: "stubbed",
        reason: "Resend not configured — need RESEND_API_KEY and DEFAULT_FROM_EMAIL",
      };
    }

    try {
      const response = await getClient().emails.send({
        to,
        from: from ?? env.DEFAULT_FROM_EMAIL!,
        subject,
        text: body,
      });

      if (response.error) {
        return { status: "failed", errorMessage: response.error.message };
      }
      return { status: "sent", providerMessageId: response.data?.id ?? null };
    } catch (err) {
      return {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
