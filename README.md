# LeadOS

LeadOS is a Leadstack.dev-style white-label CRM and agency software builder.

It is designed for agencies that want to launch their own branded CRM and lead follow-up system for local business clients.

## Core Idea

An agency owner can:

1. Sign up.
2. Create an agency account.
3. Create a client workspace.
4. Install a niche blueprint.
5. Capture leads with a public form.
6. Convert form submissions into contacts and opportunities.
7. Track those opportunities in a CRM pipeline.
8. Send consent-gated SMS/email follow-up.
9. Eventually add delayed automations, billing, white-label domains, API/MCP access, and advanced reporting.

## MVP Success Loop

The first working version is successful when this loop works:

Public form submission -> contact created -> form submission created -> opportunity created -> opportunity appears in pipeline -> workflow run created -> audit event created -> dashboard stats update.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Supabase Auth
- Prisma ORM
- Zod
- React Hook Form
- dnd-kit, if practical for pipeline drag and drop
- TanStack Table, if useful

Future integrations:

- Stripe for billing
- Trigger.dev for delayed automations
- API/MCP tooling for AI-agent access
- x402 for selected machine/API/agent payments after API/MCP exists
- Sentry for error tracking
- PostHog for product analytics

Current integrations:

- Twilio for SMS
- Resend for email
- Svix verification for Resend webhooks

## Project Files

Important project planning files:

- `CLAUDE.md` - Claude Code operating instructions
- `MEMORY.md` - persistent session memory
- `PRODUCT_SPEC.md` - product requirements
- `ROADMAP.md` - phased build plan
- `DECISIONS.md` - architecture decisions
- `TASKS.md` - current implementation tasks
- `TEST_PLAN.md` - manual and technical test plan
- `UI_DIRECTION.md` - visual/product design direction
- `SEED_DATA.md` - demo data and blueprints
- `PROMPTS.md` - useful Claude Code prompts

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Fill in environment variables. The repo ships a pre-populated `.env` file (gitignored) with every key LeadOS uses — just open it and paste your values. At minimum you need a Supabase project (free tier is fine) and its Postgres connection strings.

   Fill in:

   - `DATABASE_URL` — Supabase pooled connection (port 6543 with `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` — Supabase direct connection (port 5432)
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the Supabase project's API settings
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only, never exposed to the browser
   - `ADMIN_EMAILS` — comma-separated emails who get `/admin` access
   - `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` — Twilio credentials for SMS sending and webhook verification
   - `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID` — default outbound SMS sender fallback
   - `RESEND_API_KEY` and `DEFAULT_FROM_EMAIL` — Resend credentials for email sending
   - `RESEND_WEBHOOK_SECRET` — Resend/Svix webhook signing secret for `/api/webhooks/resend`

3. Generate the Prisma client and validate the schema:

   ```bash
   npx prisma validate
   npx prisma generate
   ```

4. Push the schema to your Supabase Postgres (creates all tables). If you already ran `init`, run with a Phase 2 name to apply the new messaging fields:

   ```bash
   # First time
   npx prisma migrate dev --name init

   # Or, after Phase 2 schema additions (Message.status, fromAddress, toAddress,
   # subject, errorMessage, Conversation.lastMessageAt, unique conversation key)
   npx prisma migrate dev --name phase2_messaging
   ```

5. Seed demo data (idempotent — safe to rerun). This loads the 3 system blueprints plus the Spark Growth Systems / BrightSkin Med Spa demo workspace:

   ```bash
   npm run db:seed
   ```

6. Run the development server:

   ```bash
   npm run dev
   ```

7. Visit:

   - <http://localhost:3000> — landing page
   - <http://localhost:3000/signup> — create an account
   - <http://localhost:3000/onboarding> — create your agency + first workspace
   - <http://localhost:3000/forms/brightskin-med-spa-consultation-request> — submit the seeded public form to see the full money path in action

## Phase 2 Validation Checklist

Before moving into Phase 3, validate:

- Public form submission with SMS/email consent creates or updates contact, form submission, opportunity, workflow run, audit event, and dashboard stats.
- Contact profile can send SMS when the contact has a normalized phone number and `consentSms=true`.
- Contact profile can send email when the contact has an email address and `consentEmail=true`.
- Conversation history appears on the contact profile and Inbox.
- Resend webhook endpoint is configured as `/api/webhooks/resend`, uses `RESEND_WEBHOOK_SECRET`, and updates message status from signed events.
- Twilio webhook endpoints are configured as `/api/webhooks/twilio/sms` and `/api/webhooks/twilio/status`.
- Tenant Settings contains the tenant's Twilio phone number in E.164 format, e.g. `+15551234567`.
- Replying `STOP` to the Twilio number revokes SMS consent for the matching contact.

## Environment Variables

See `.env` in the repo root — it lists every variable LeadOS uses, grouped by phase (Phase 1 Supabase/app, Phase 2 Twilio/Resend, Phase 3 Trigger.dev, Phase 4 Stripe, optional observability).

`.env` is gitignored. Never commit real secrets.

Do not expose server-only keys to the browser. Only `NEXT_PUBLIC_*` variables are bundled into client code.

## Multi-Tenancy

LeadOS uses a shared-database, shared-schema model.

Every client-owned table must include `tenantId`.

Tenant data must never be queried without server-side access checks.

Expected hierarchy:

UserProfile -> Membership -> Agency -> Tenant / Client Workspace

## Blueprints

Blueprints are reusable niche CRM setups.

A blueprint can install:

- pipeline stages
- lead capture forms
- workflow definitions
- tags/default settings if practical

Seeded system blueprints:

1. Med Spa Lead Follow-Up Blueprint
2. Roofer Estimate Request Blueprint
3. Dentist Appointment Request Blueprint

## Current Limitations

Phase 2 is implemented at the application layer, but these items are still outstanding:

- Phase 2 Prisma migration must be applied to Supabase before production runtime testing.
- Delayed workflows and retries are not implemented yet.
- Unknown inbound SMS senders are audited and dropped instead of auto-created as contacts.
- `notify_owner` and `create_audit_event` workflow actions are still placeholders.
- Stripe billing is not implemented yet.
- Custom domains, full visual workflow builder, AI chatbot, mobile app, website builder, and advanced reporting are not implemented yet.
- Stable public API, MCP tools, and x402 machine-payment endpoints are not implemented yet.

## Roadmap Summary

Phase 1:

- Auth
- Agency onboarding
- Tenant workspaces
- Contacts
- Pipeline
- Forms
- Workflow placeholders
- Blueprints

Phase 2 (application-layer complete, needs production validation):

- Twilio SMS dispatch (graceful fallback when keys absent)
- Resend email dispatch (graceful fallback when keys absent)
- Conversation/Message persistence per contact + channel
- Outbound composer on the contact detail page
- Real Inbox listing all tenant conversations
- Inbound webhooks: `/api/webhooks/twilio/sms`, `/api/webhooks/twilio/status`, `/api/webhooks/resend`
- STOP keyword auto-unsubscribe (revokes `consentSms`)
- Consent checks before every outbound send
- Public forms collect explicit SMS/email opt-in before workflow sends are allowed
- Tenant settings include a Twilio phone number used for outbound SMS and inbound routing

Phase 3:

- Real automation execution
- Template variables
- Trigger.dev delayed jobs
- Retries, owner notifications, and unknown inbound SMS contact creation

Phase 4:

- Stripe billing
- Subscription gating
- Customer portal

Phase 5:

- White-label branding
- Custom domains
- Client portals
- Advanced blueprints

Phase 6:

- Versioned API routes
- API keys/scopes/rate limits
- MCP tools for safe AI-agent access
- AI-safe action boundaries and audit metadata
- Optional x402 payment gates for selected machine/API/agent endpoints

## Claude Code Usage

Start Claude Code in the project root and say:

```text
Read CLAUDE.md and MEMORY.md first.

Then inspect the repository and summarize:
1. What exists
2. What is missing
3. What you will build first

After that, implement Phase 1 foundation from TASKS.md.

Do not ask broad questions. Make reasonable assumptions. Build the smallest production-quality version that satisfies the acceptance criteria.
```

At the end of each session, Claude Code should update `MEMORY.md`.
