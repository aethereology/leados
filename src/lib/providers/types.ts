import "server-only";

export type SendResult =
  | {
      status: "sent";
      providerMessageId: string | null;
    }
  | {
      status: "stubbed";
      reason: string;
    }
  | {
      status: "failed";
      errorMessage: string;
    };

export interface SmsProvider {
  readonly name: "twilio";
  readonly isConfigured: boolean;
  sendSms(input: { to: string; body: string; from?: string }): Promise<SendResult>;
}

export interface EmailProvider {
  readonly name: "resend";
  readonly isConfigured: boolean;
  sendEmail(input: {
    to: string;
    subject: string;
    body: string;
    from?: string;
  }): Promise<SendResult>;
}
