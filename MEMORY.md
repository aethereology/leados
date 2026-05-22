# MEMORY.md - LeadOS Session Memory

This file is updated at the end of every Claude Code session so future sessions can resume intelligently.

## Project

LeadOS is a Leadstack.dev-style white-label CRM and agency software builder.

Core MVP loop:

Public lead form submission -> contact created -> form submission created -> opportunity created -> opportunity appears in pipeline -> workflow run created -> audit event created -> dashboard stats update.

## Current State

**Phase 2 (Messaging) is implemented and live end-to-end, with the post-audit fixes applied.** Both Prisma migrations (`init` and `phase2_messaging`) are registered as applied in Supabase (verified via `npx prisma migrate deploy` on 2026-05-22 — reported "No pending migrations to apply"), so the new Message/Conversation fields exist in the real DB and runtime Prisma calls work. Outbound SMS and email now actually dispatch via Twilio/Resend (with a graceful "stubbed" fallback when env keys are absent — the Message row is still created so the UI stays consistent). Workflow definitions with `send_sms` / `send_email` actions now flow leads → contact → opportunity → real follow-up. Public forms now require explicit SMS/email opt-in before workflow sends are allowed. Phone numbers are normalized to E.164-style values on new writes and webhook lookups include common legacy variants. A contact's detail page has a real message composer with channel switching, consent gating, and conversation history. The Inbox page renders real conversations sorted by `lastMessageAt`. Three inbound webhook routes are live: Twilio SMS (with STOP-keyword auto-unsubscribe), Twilio status callback, and Resend event webhook (Svix-verified status updates by `email_id`). All checks pass: `npx tsc --noEmit`, `npx prisma validate`, `npm run lint`, and `npx next build`.

## Current Stack Decision

- Next.js 14 App Router (next 14.2.15)
- TypeScript (strict)
- Tailwind CSS + shadcn-style UI primitives (inline)
- Supabase Auth via @supabase/ssr (with middleware refresh)
- Prisma ORM (postgresql)
- Zod for input validation
- React Hook Form available, server actions used for forms
- lucide-react icons
- Pipeline stage moves via per-card stage select (dnd-kit deferred)
- **Phase 2:** `twilio@^5.10.3` for SMS, `resend@^6.12.3` for email, `svix@^1.94.0` for Resend webhook verification

## Current Architecture Decision

### Multi-tenancy (unchanged)

Shared database, shared schema, tenant-scoped rows. Every client-owned model includes `tenantId`. All tenant data access goes through `src/lib/access.ts` utilities. Audit events written via `createAuditEvent`.

### Messaging layer (new in Phase 2)

- **Provider adapters** (`src/lib/providers/{types,twilio,resend}.ts`): each exposes a single `send*` method that returns a discriminated `SendResult` (`sent` | `stubbed` | `failed`). Stubbed = env keys absent; failed = provider rejected the request.
- **Messaging core** (`src/lib/messaging.ts`): the only entry point for writes to Conversation/Message. Owns consent gating, conversation upsert via `@@unique([tenantId, contactId, channel])`, dispatch, status mapping, audit, and `lastMessageAt` bump. All callers — server actions, webhook routes, workflow runner — go through `sendOutboundMessage` / `recordInboundMessage` so consent and audit can never be skipped.
- **Template variables**: `renderTemplate` does `{{firstName}}`-style substitution. The workflow runner builds vars from `Contact` fields and the form payload, so `send_sms` / `send_email` action bodies can reference both.
- **Webhooks**: tenant routing is by phone number (Twilio) or message ID (status/email events). The Twilio inbound route looks up the destination tenant via `ProviderAccount.provider="twilio"` with `configJson.fromNumber` matching the normalized `To` field. Each tenant configures their Twilio phone number in Settings and points that Twilio number at the shared webhook URL.

### Workflow runner (rewritten)

`runWorkflowsForTrigger` is no longer a placeholder. Per-action outcomes are recorded in `resultJson` as `{type, status: "executed"|"skipped"|"failed", detail?, messageId?}`. Unknown action types, no consent, and no destination are skipped; provider send failures mark the action and workflow run as `failed`.

### API / MCP / AI / x402 Direction

The codebase is partially ready for API/MCP/AI access because core behavior lives in server-side utilities instead of only UI components. It is not yet a stable API platform. Future work should add versioned `/api/v1` routes, token/API-key auth, scoped permissions, rate limits, API/MCP actor audit metadata, safe AI command boundaries, and MCP tools around contacts, forms, conversations, workflows, and blueprints.

Strategic payment decision: keep Stripe as the main human SaaS billing rail for Phase 4. Consider x402 later for machine/API/agent payments on selected paid endpoints or MCP tools after the API/MCP layer exists.

## Files Changed This Session

### TypeScript correctness (pre-Phase-2)

- `src/lib/workflows.ts` — fixed Prisma `InputJsonValue` typing for `contextJson`/`resultJson` by importing `Prisma` namespace and casting.

### Schema (`prisma/schema.prisma`)

- Added `MessageStatus` enum (`queued | sent | delivered | failed | received`).
- `Conversation`: added `lastMessageAt DateTime?`, added unique `[tenantId, contactId, channel]`, added index on `[tenantId, lastMessageAt]`.
- `Message`: added `status` (default `queued`), `subject`, `fromAddress`, `toAddress`, `errorMessage`. Added index on `providerMessageId` for webhook lookups.

### Providers + messaging core (new)

- `src/lib/providers/types.ts` — `SmsProvider`, `EmailProvider`, `SendResult` discriminated union.
- `src/lib/providers/twilio.ts` — Twilio adapter. Supports both `TWILIO_FROM_NUMBER` and `TWILIO_MESSAGING_SERVICE_SID`. Returns `stubbed` when unconfigured.
- `src/lib/providers/resend.ts` — Resend adapter using `DEFAULT_FROM_EMAIL`.
- `src/lib/messaging.ts` — `sendOutboundMessage`, `recordInboundMessage`, `revokeSmsConsent`, `renderTemplate`.

### Workflow runner

- `src/lib/workflows.ts` — full rewrite. Real dispatch for `send_sms`, `send_email`, `add_tag`. `notify_owner` and `create_audit_event` left as Phase 3 placeholders (recorded as `skipped`). Per-action outcomes captured.

### App UI

- `src/lib/zod-schemas.ts` — added `messageSendSchema`.
- `src/app/app/[tenantSlug]/contacts/actions.ts` — added `sendContactMessageAction` server action with consent gating and audit.
- `src/components/contacts/MessageComposer.tsx` — new client component. Channel switcher (only shows channels with consent + destination), subject field for email, surfaces success/error state.
- `src/app/app/[tenantSlug]/contacts/[contactId]/page.tsx` — added "Send a message" card and "Conversations" card with full message history.
- `src/app/app/[tenantSlug]/inbox/page.tsx` — replaced placeholder with real conversation list (sorted by `lastMessageAt`, click-through to contact).

### Webhooks (new)

- `src/app/api/webhooks/twilio/sms/route.ts` — inbound SMS. Twilio signature verification when `TWILIO_AUTH_TOKEN` is set. Tenant lookup by destination number via `ProviderAccount`. STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT keywords revoke `consentSms`. Returns empty TwiML.
- `src/app/api/webhooks/twilio/status/route.ts` — outbound delivery status callback. Maps Twilio's `MessageStatus` (`queued`/`sent`/`delivered`/`failed`/etc.) onto our enum, updates by `MessageSid`.
- `src/app/api/webhooks/resend/route.ts` — Resend event webhook. Handles `email.sent`/`delivered`/`bounced`/`complained`/`failed`. Verifies Svix signatures using `RESEND_WEBHOOK_SECRET` before updating by `email_id`.

### Env

- `src/lib/env.ts` — added `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_MESSAGING_SERVICE_SID`, `RESEND_API_KEY`, `DEFAULT_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`. Added `isTwilioConfigured()` and `isResendConfigured()`.
- `.env` — added `TWILIO_FROM_NUMBER` slot with a comment explaining the existing `TWILIO_MESSAGING_SERVICE_SID` value (`ACdfd…`) appears to be the Account SID, not a real Messaging Service SID (which would start with `MG…`). User needs to either fill `TWILIO_FROM_NUMBER` with a provisioned E.164 number or fix the Messaging Service SID.

### Docs

- `README.md` — expanded Phase 2 section to enumerate what's now live; added a second `prisma migrate dev --name phase2_messaging` example for repos that already ran `init`.

### Post-audit fixes applied after Phase 2

- `src/app/api/webhooks/resend/route.ts` — now verifies Svix signatures with `RESEND_WEBHOOK_SECRET` and fails closed when missing.
- `src/lib/phone.ts` — added phone normalization and lookup helpers.
- `src/app/forms/[formSlug]/submit.ts` and `PublicFormView.tsx` — public forms now collect explicit SMS/email opt-in instead of granting consent from phone/email presence.
- `src/lib/messaging.ts` and Twilio webhook routes — outbound, inbound, and STOP handling normalize phone numbers and match common legacy variants.
- `src/app/app/[tenantSlug]/settings/page.tsx` and `settings/actions.ts` — tenant Twilio number settings now drive outbound sender selection and inbound routing.
- `src/lib/workflows.ts` — provider send failures now mark workflow action/run as failed instead of skipped.
- `src/lib/zod-schemas.ts` — fixed SMS composer validation by treating missing `subject` as an empty string.
- Docs updated to reflect Phase 2 status, validation flow, and API/MCP/AI/x402 direction.

## Commands Run

- `npm install twilio resend` — succeeded (`added 35 packages in 6s`).
- `npx prisma validate` — schema valid.
- `npx prisma generate` — TypeScript types regenerated (DLL rename failed with EPERM because a long-running node process holds the engine binary; types updated regardless).
- `npm run typecheck` / `npx tsc --noEmit` — zero errors.
- `npm run lint` (`next lint`) — zero warnings or errors.
- `npx next build` — full production build succeeded. All 3 webhook routes registered (`/api/webhooks/twilio/sms`, `/api/webhooks/twilio/status`, `/api/webhooks/resend`).
- Local webhook smoke test: unsigned Resend webhook returns 403; locally Svix-signed Resend webhook returns 200.

## Checks Passed

- Self-review: every messaging write path enforces tenant scope (`tenantId` is always provided by `requireTenantAccess` or the webhook tenant lookup, never trusted from a request param).
- Self-review: consent is checked at exactly one place (`sendOutboundMessage`). The composer can't call provider adapters directly, and neither can the workflow runner.
- Self-review: STOP keyword handler is idempotent (`updateMany` with `data.consentSms = false`; only audits when `count > 0`).
- Self-review: webhooks return 2xx for unmatched / unknown events so providers don't retry. Twilio signature is enforced when an auth token is set.
- Self-review: Resend webhook requires `RESEND_WEBHOOK_SECRET` and verifies Svix signatures before mutating message status.
- Self-review: missing provider keys never break the app — `SendResult.status = "stubbed"` flows through the same UI surface as a real send, marked as `queued` with the reason in `errorMessage`.
- TypeScript: clean.
- ESLint: clean.
- Prisma schema validation: clean.
- Production build: clean.

## Checks Failed or Skipped

- `npx prisma generate` / `npm run build` can fail on Windows with EPERM when a Next/node process holds Prisma's query engine DLL. `npx next build` succeeds once Prisma client generation is not attempted under the lock. The user should run `npm run db:generate` after closing all dev-server/prod-server processes.
- **Phase 2 migration is applied** (verified via `npx prisma migrate deploy` on 2026-05-22 — reported "No pending migrations to apply"). Both `init` and `phase2_messaging` are registered in Supabase.

## Known Bugs / Things to Watch

- The user's `.env` has `TWILIO_MESSAGING_SERVICE_SID=ACdfd…` which is the Account SID, not a Messaging Service SID. They need to either fill `TWILIO_FROM_NUMBER` with a provisioned Twilio number or replace the service SID with a real `MG…` value before SMS will actually dispatch.
- Resend webhook now requires `RESEND_WEBHOOK_SECRET`; without it the route returns 503 and does not mutate message status.
- Inbound SMS from a phone number with no matching contact is logged via audit (`message.sms.inbound.unmatched`) but dropped. Phase 3 should auto-create a contact for unknown senders.
- `notify_owner` and `create_audit_event` workflow action types are recorded as `skipped` rather than dispatched.
- Pipeline drag-and-drop and visual workflow builder are still deferred.
- Supabase RLS policies are still not written. Tenant isolation remains application-layer only via `src/lib/access.ts`.

## Architecture Decisions Made

- Messaging writes funnel through a single `src/lib/messaging.ts` so consent checks, audit, and conversation timestamps can never be bypassed.
- Provider adapters expose a discriminated `SendResult` so the caller can distinguish a real send from a stubbed-because-not-configured run without exceptions. Stubbed sends still persist a Message row so the UI doesn't lie about what happened.
- Twilio supports both `TWILIO_FROM_NUMBER` and `TWILIO_MESSAGING_SERVICE_SID`; the SDK call branches on which is set.
- Conversations are unique per `(tenantId, contactId, channel)`. This lets the composer and the inbound webhook both safely upsert without races.
- Phase 2 webhooks are tenant-routed by destination number (Twilio) or provider message id (status callbacks) — no per-tenant URL paths.
- STOP keyword set kept narrow (STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT) — matches the Twilio defaults.

## Next Best Task — Phase 3 (Automations Hardening)

Phase 2 dispatch works one-shot. Phase 3 should add:

1. **Delayed actions** (e.g., "send follow-up SMS 24h after form submit") via Trigger.dev. Add a `delaySeconds` field to the action JSON shape and a Trigger.dev job that calls back into the same `sendOutboundMessage`.
2. **Retry on transient failures** — `failed` Messages with retriable Twilio/Resend error codes should re-enqueue.
3. **`notify_owner`** — resolve the tenant's `agency_owner` Membership, send them an email through Resend.
4. **`create_audit_event`** as a real workflow action (currently skipped).
5. **Unknown-sender inbound contact creation** — Phase 2 drops these; Phase 3 should create a Contact with `source="inbound_sms"` and `consentSms=true`.

The exact prompt to use:

> Read MEMORY.md. Implement Phase 3 (Automations Hardening) from ROADMAP.md. Add Trigger.dev-backed delayed actions to runWorkflowsForTrigger, real `notify_owner` and `create_audit_event` dispatch, retry-on-failure for transient provider errors, and unknown-sender contact creation in the Twilio inbound webhook. Update MEMORY.md when done.
