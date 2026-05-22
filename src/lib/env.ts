// Centralized env access. Server-only env vars must NEVER be exported via the
// `NEXT_PUBLIC_` prefix.

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",

  // Phase 2 — messaging providers
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL,
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getAdminEmails(): string[] {
  return env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      (env.TWILIO_FROM_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID),
  );
}

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.DEFAULT_FROM_EMAIL);
}
