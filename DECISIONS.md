# LeadOS Architecture Decisions

## Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Supabase Auth
- Prisma ORM
- Zod
- React Hook Form
- Twilio for SMS
- Resend for email
- Svix for Resend webhook verification

Future:

- Stripe for billing
- Trigger.dev for delayed jobs
- API/MCP service access for AI-agent workflows
- x402 for selected machine/API/agent-paid endpoints after API/MCP is stable

## Multi-Tenancy

Use a shared database and shared schema.

Every client-owned row must include `tenantId`.

Tenant data must be protected by server-side access checks.

Do not rely on frontend filtering.

## Entity Hierarchy

UserProfile -> Membership -> Agency -> Tenant / Client Workspace

## Roles

Use these roles:

- super_admin
- agency_owner
- agency_admin
- tenant_admin
- agent
- viewer

## Core Models

Required models:

- UserProfile
- Agency
- Tenant
- Membership
- Contact
- Pipeline
- PipelineStage
- Opportunity
- Form
- FormSubmission
- Conversation
- Message
- Appointment
- WorkflowDefinition
- WorkflowRun
- ProviderAccount
- BillingSubscription
- AuditEvent
- Blueprint
- BlueprintItem
- BlueprintInstall

## Model Notes

### UserProfile

Maps Supabase Auth users into the application database.

Important fields:

- id
- authUserId
- email
- name

### Agency

Represents the agency using LeadOS.

Important fields:

- id
- name
- slug
- brandingJson

### Tenant

Represents a client workspace under an agency.

Important fields:

- id
- agencyId
- name
- slug
- status
- brandingJson
- businessInfoJson

Use unique constraint on agencyId + slug.

### Membership

Connects users to agencies or tenants with roles.

### Contact

Represents leads/customers inside a tenant.

Must include tenantId.

Important fields:

- firstName
- lastName
- email
- phone
- source
- tags
- notes
- consentSms
- consentEmail

### Pipeline and PipelineStage

Pipelines belong to tenants.

Stages belong to pipelines.

Use position for ordering.

### Opportunity

Opportunities belong to tenants and are placed in pipeline stages.

Important fields:

- contactId
- pipelineId
- stageId
- title
- value
- status
- source

### Form

Forms belong to tenants.

Important fields:

- name
- slug
- schemaJson
- isActive

### FormSubmission

Form submissions belong to tenants and forms.

Store raw submitted payload in payloadJson.

### WorkflowDefinition

Stores automation definitions.

Do not build visual workflow builder in Phase 1.

### WorkflowRun

Stores execution records for workflow automation actions and outcomes.

### Blueprint

Reusable niche setup.

Can be system-owned or agency-owned.

### BlueprintItem

Stores installable items for a blueprint.

Item types should support:

- pipeline
- form
- workflow
- tag
- setting

### BlueprintInstall

Records that a blueprint was installed into a tenant.

Use unique blueprintId + tenantId to avoid duplicate installs.

## Product Direction

Build the money path first:

Lead capture form -> contact -> opportunity -> pipeline -> workflow run.

Do not build a full GoHighLevel clone immediately.

Phase 2 product loop:

Lead capture form with explicit opt-in -> contact -> opportunity -> workflow run -> consent-gated SMS/email follow-up -> conversation history -> inbox visibility.

## Validation Decision

Use Zod for all server actions and route handlers that accept user input.

## UI Decision

Use a clean B2B SaaS dashboard interface.

Inspiration:

- Linear
- Attio
- Stripe Dashboard
- HubSpot CRM
- GoHighLevel agency dashboard, but cleaner

## Future Integration Boundaries

Provider integrations should use adapter interfaces so Twilio, Resend, Stripe, and Trigger.dev can be swapped or extended later.

Messaging writes must flow through `src/lib/messaging.ts` so consent checks, provider dispatch, message logging, conversation timestamps, and audit events remain consistent.

Phone numbers should be normalized before storage or provider dispatch. Webhooks should also match common legacy phone formats so existing contacts can still receive inbound messages and STOP handling.

Resend webhooks must verify Svix signatures with `RESEND_WEBHOOK_SECRET` before mutating message state.

## API, MCP, AI, and x402 Decision

LeadOS should be designed so important domain actions can eventually be called by:

- dashboard UI
- versioned API routes
- MCP tools
- AI-agent workflows

The current code is only partially ready because core logic is server-side, but it does not yet expose a stable API/MCP layer.

Before MCP or AI-agent access, add:

- `/api/v1` route boundaries around proven workflows
- API keys or service tokens separate from browser sessions
- tenant-scoped service access checks
- permission scopes and rate limits
- API/MCP/AI actor metadata in audit logs
- explicit confirmation boundaries for destructive or outbound actions

Stripe remains the primary payment rail for human SaaS subscriptions. x402 is reserved for future machine-to-machine/API/MCP/agent payment gates, not the main dashboard billing flow.

## Security Decision

Never expose server-only keys to the browser.

Use environment variables.

Add Supabase RLS TODOs if RLS is not fully implemented in Phase 1.
