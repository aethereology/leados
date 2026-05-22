# LeadOS Current Tasks

## Current Status

Phase 1 foundation is complete. Phase 2 messaging is implemented at the application layer and post-audit fixes have been applied.

Phase 2 still needs real production validation against Supabase, Twilio, and Resend.

## Next Priority

Validate Phase 2 end to end before starting Phase 3.

## Phase 2 Validation Acceptance Criteria

Phase 2 is ready to close when:

- Phase 2 Prisma migration has been applied to Supabase.
- User can submit a public form with explicit SMS/email consent.
- Public form submission creates or updates contact, form submission, opportunity, workflow run, audit event, and dashboard stats.
- Workflow `send_sms` sends or records a message through the messaging adapter.
- Workflow `send_email` sends or records a message through the messaging adapter.
- Contact profile can manually send SMS and email when consent and destination exist.
- Contact profile shows conversation history.
- Inbox shows recent conversations ordered by activity.
- Resend webhook verifies `RESEND_WEBHOOK_SECRET` and updates message status.
- Twilio inbound SMS webhook routes by tenant Twilio number.
- Twilio status webhook updates outbound SMS status.
- Sending `STOP` revokes SMS consent for the matching contact.
- Tenant isolation remains intact across contacts, forms, conversations, and workflows.

## Required Local Checks

Run where available:

```bash
npx prisma validate
npm run lint
npm run typecheck
npx next build
```

`npm run build` includes `prisma generate`; on Windows it may fail with EPERM if a running Next/node process holds Prisma's query engine DLL. Close running app servers before using `npm run build` or `npm run db:generate`.

## Environment Checklist

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`
- `RESEND_API_KEY`
- `DEFAULT_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`

Tenant Settings must also include the tenant Twilio phone number in E.164 format, such as `+15551234567`.

## Next Build Task After Validation

Implement Phase 3 Automations Hardening:

- Delayed actions via Trigger.dev or an equivalent job boundary.
- Retry handling for transient provider failures.
- Real `notify_owner` workflow action.
- Real `create_audit_event` workflow action.
- Unknown inbound SMS contact creation.
- Stronger Zod validation for workflow action JSON.

## Later Architecture Track

After Phase 3 or during a dedicated platform-hardening pass:

- Add versioned `/api/v1` routes.
- Add API keys/service tokens, scopes, and rate limits.
- Add API/MCP/AI actor metadata to audit events.
- Add safe MCP tools around proven domain actions.
- Consider x402 only for selected machine/API/agent-paid endpoints after API/MCP is stable.
