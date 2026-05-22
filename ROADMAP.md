# LeadOS Roadmap

## Phase 1: Platform Foundation

Goal:

Build the core CRM/agency software foundation.

Deliverables:

- Auth
- Agency onboarding
- Tenant/client workspace creation
- Tenant switcher
- Dashboard
- Contacts
- Pipeline
- Forms
- Public form submissions
- Workflow placeholder
- Blueprint system
- Settings placeholders
- Admin placeholder
- Seed data
- README

Success loop:

Public form submission -> contact -> opportunity -> pipeline -> workflow run -> audit event -> dashboard visibility.

## Phase 2: Messaging

Goal:

Turn LeadOS from a CRM foundation into a working lead follow-up system.

Deliverables:

- Twilio SMS provider adapter
- Resend email provider adapter
- Message composer on contact profile
- Conversation history
- Outbound message logging
- Inbound Twilio SMS webhook
- Twilio delivery status webhook
- Resend delivery event webhook with Svix verification
- Consent checks for SMS and email
- Explicit public-form SMS/email opt-in
- STOP/unsubscribe handling
- Tenant Twilio phone number setting for inbound routing

Status:

Application-layer complete after senior engineer audit fixes. Production validation still requires applying the Phase 2 Prisma migration to Supabase and testing real Twilio/Resend delivery.

## Phase 3: Automations

Goal:

Move from one-shot workflow actions to hardened automation execution.

Deliverables:

- Real workflow action execution
- Template variables
- Trigger.dev delayed jobs
- Follow-up sequences
- Appointment reminders
- Workflow run logs
- Error handling and retries
- Unknown inbound SMS contact creation
- Real `notify_owner` and `create_audit_event` workflow actions

## Phase 4: Billing

Goal:

Allow agencies to subscribe and manage billing.

Deliverables:

- Stripe customer creation
- Stripe Checkout
- Stripe Customer Portal
- Stripe webhook handler
- BillingSubscription sync
- Plan gating placeholder
- Usage-based metering TODOs

Plans:

- Starter: $297/month
- Growth: $497/month
- Agency: $997/month

## Phase 5: White Label

Goal:

Make LeadOS feel like agency-owned software.

Deliverables:

- Agency branding
- Tenant branding
- Custom domains
- White-label login page
- Email sender domain setup
- Client portal polish

## Phase 6: Expansion

Goal:

Add advanced agency platform capabilities.

Deliverables:

- Blueprint marketplace
- Visual automation builder
- Calendar sync
- Review request automation
- Import/export
- Advanced reporting
- Lead source attribution
- Team permissions UI
- Client billing through Stripe Connect, if needed

## Phase 7: API, MCP, AI, and Machine Payments

Goal:

Make LeadOS safely callable by API clients, MCP tools, and AI agents.

Deliverables:

- Versioned `/api/v1` routes around proven domain workflows
- API keys or service tokens separate from browser sessions
- Permission scopes, rate limits, and tenant-safe service access checks
- API/MCP/AI actor metadata in audit logs
- MCP tools for contacts, forms, conversations, workflows, blueprints, and reporting
- AI-safe action boundaries: draft/suggest/read first, explicit confirmation for destructive or outbound actions
- Optional x402 payment gates for selected machine/API/agent endpoints after API/MCP is stable

Payment direction:

- Stripe remains the primary rail for human SaaS subscriptions and agency billing.
- x402 is reserved for machine-to-machine, API, MCP, and agent-paid usage.

## Build Rule

Do not move deeply into the next phase until the current phase's core loop works and checks pass.
