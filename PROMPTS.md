# LeadOS Claude Code Prompts

## First Build Prompt

Use this after placing the project files in the repo:

```text
Read CLAUDE.md and MEMORY.md first.

Then inspect the repository and summarize:
1. What exists
2. What is missing
3. What you will build first

After that, implement Phase 1 foundation from TASKS.md.

Do not ask broad questions. Make reasonable assumptions. Build the smallest production-quality version that satisfies the acceptance criteria.
```

## Review and Fix Prompt

Use this after Claude Code completes the first implementation pass:

```text
Now review the entire LeadOS implementation as a senior SaaS architect.

Focus on:
- tenant isolation
- auth/session correctness
- Prisma schema correctness
- broken routes
- TypeScript errors
- missing validation
- insecure data access
- broken form submissions
- blueprint install bugs
- missing seed data
- UI consistency
- missing README instructions

Run:
- npx prisma validate
- npx prisma generate
- npm run lint
- npm run typecheck if available
- npm run build if practical

Fix all issues you reasonably can.

Then update MEMORY.md and give me:
1. What was broken
2. What you fixed
3. What still needs work
4. The exact next prompt I should use for Phase 2 integrations
```

## Phase 2 Messaging Prompt

Historical prompt. Phase 2 is now application-layer complete; use this only for reference or rebuilds.

```text
Add Phase 2 integrations to LeadOS.

Goal:
Turn LeadOS from a CRM foundation into a working lead follow-up system.

Add:
1. Twilio SMS provider adapter
2. Resend email provider adapter
3. Message composer on contact profile
4. Conversation history
5. Outbound message logging
6. Inbound Twilio and Resend webhook routes
7. Workflow execution for form_submitted
8. Template variables in automation messages
9. Consent checks for SMS/email

Requirements:
- Do not hardcode credentials.
- Use environment variables.
- Add .env.example entries.
- Create provider adapter interfaces.
- Store every outbound message in Message.
- Create or reuse Conversation per contact/channel.
- Check contact.consentSms before SMS.
- Check contact.consentEmail before email.
- Add STOP/unsubscribe handling.
- Add webhook signature verification.
- Add audit events for outbound messages.

Supported workflow actions:
- send_sms
- send_email
- add_tag
- create_audit_event

Supported template variables:
- {{firstName}}
- {{lastName}}
- {{email}}
- {{phone}}
- {{tenantName}}

When public form is submitted:
1. Create/update contact
2. Create form submission
3. Create opportunity
4. Find active workflows for triggerType form_submitted
5. Execute supported actions
6. Create workflow run
7. Log audit event

Add UI:
- Contact profile message composer
- Conversation history
- Automation create/edit form improvements
- Basic workflow test button if practical

Run checks, fix errors, and update MEMORY.md.
```

## Phase 2 Validation Prompt

```text
Read MEMORY.md, TEST_PLAN.md, and TASKS.md.

Validate Phase 2 end to end against the current local/Supabase environment:
1. Confirm Prisma migration status.
2. Confirm Twilio and Resend env vars are present without printing secrets.
3. Validate public form submission with explicit SMS/email opt-in.
4. Validate manual contact SMS and email composer sends.
5. Validate conversation history and Inbox.
6. Validate Resend webhook signature verification.
7. Validate Twilio inbound/status webhooks if public tunnel and Twilio number are available.

Do not change code unless a validation failure reveals a real bug. If you fix anything, rerun checks and update MEMORY.md.
```

## Phase 3 Automations Prompt

```text
Read MEMORY.md first. Add Phase 3 real automation execution to LeadOS.

Goal:
Make workflow actions reliable and extensible.

Add:
1. Workflow execution service
2. Template variable renderer
3. Workflow action registry
4. Trigger.dev delayed job integration or an equivalent job boundary, if practical
5. Workflow run logs
6. Error states and retries
7. Manual test workflow action

Support actions:
- send_sms
- send_email
- add_tag
- create_audit_event
- notify_owner
- wait/delay

Requirements:
- Keep workflow definitions tenant-scoped.
- Validate actionsJson with Zod.
- Never execute an action without tenant context.
- Log workflow run input/output.
- Make execution testable.

Run checks, fix errors, and update MEMORY.md.
```

## API, MCP, AI Readiness Prompt

```text
Read MEMORY.md, DECISIONS.md, and ROADMAP.md.

Design, then implement the smallest safe API/MCP readiness layer:
1. Add internal service boundaries for proven domain actions.
2. Add versioned /api/v1 route conventions.
3. Add API-key/service-token auth with tenant scopes.
4. Add audit actor metadata for browser, API, MCP, and AI callers.
5. Do not expose destructive or outbound actions to AI/MCP without explicit confirmation boundaries.

Do not add x402 yet. Leave an extension point for future paid machine/API/agent endpoints.
Run checks and update MEMORY.md.
```

## Phase 4 Stripe Billing Prompt

```text
Add Stripe billing to LeadOS.

Goal:
Allow agencies to subscribe to a monthly plan and manage billing.

Add:
1. Stripe customer creation
2. Stripe Checkout session
3. Stripe Customer Portal session
4. Stripe webhook handler
5. BillingSubscription model usage
6. Billing page
7. Subscription status gating placeholder

Plans:
- starter: $297/month
- growth: $497/month
- agency: $997/month

Requirements:
- Use environment variables for Stripe keys and price IDs.
- Add .env.example entries.
- Verify Stripe webhook signatures using raw body.
- Store stripeCustomerId and stripeSubscriptionId.
- Update subscription status from webhook events.
- Add billing page at /app/billing.
- Add Manage billing button.
- Add TODO for usage-based metering.

Webhook events to support:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed

Run checks, fix errors, and update MEMORY.md.
```

## Phase 5 White Label Prompt

```text
Add Phase 5 white-label features to LeadOS.

Goal:
Make the platform feel agency-owned.

Add:
1. Agency branding settings
2. Tenant branding settings
3. Logo URL
4. Primary color
5. Custom app name display
6. White-label login page placeholder
7. Custom domain data model placeholder
8. Email sender domain placeholder

Requirements:
- Store branding in structured JSON where appropriate.
- Do not break existing app shell.
- Keep defaults if branding fields are empty.
- Add settings UI.
- Add TODOs for real custom domain routing.

Run checks, fix errors, and update MEMORY.md.
```
