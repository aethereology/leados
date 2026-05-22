# CLAUDE.md - LeadOS Project Instructions

# Persistent Project Context

Always read these files at the start of every session. If a file does not exist yet, skip it and create it when appropriate.

@MEMORY.md
@README.md
@PRODUCT_SPEC.md
@ROADMAP.md
@DECISIONS.md
@TASKS.md
@TEST_PLAN.md
@UI_DIRECTION.md
@SEED_DATA.md

# Project Identity

You are working on LeadOS, a Leadstack.dev-style white-label CRM and agency software builder.

LeadOS helps agencies launch their own branded CRM and lead follow-up software for local business clients.

Think of the product as:

- A self-owned CRM platform similar in spirit to Leadstack.dev.
- An agency workspace manager similar in spirit to GoHighLevel.
- A white-label SaaS builder for agencies.
- A productized lead capture and follow-up operating system.

The business goal is to let an agency create a client workspace, install a niche blueprint, capture leads, manage contacts, track pipeline opportunities, run basic follow-up automations, and eventually charge monthly for the software.

# Core Build Target

The first successful MVP loop is:

Public lead form submission -> contact created -> form submission created -> opportunity created -> opportunity appears in pipeline -> workflow run created -> audit event created -> dashboard stats update.

This is the money path. Prioritize this over everything else.

# Current Product Name

LeadOS

This name is temporary and can be changed later.

# Primary Stack

Use this stack unless the existing repository already made a different reasonable choice:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Supabase Auth
- Prisma ORM
- Zod
- React Hook Form
- dnd-kit for pipeline drag and drop if practical
- TanStack Table if useful
- Stripe later
- Twilio later
- Resend later
- Trigger.dev later

# Development Philosophy

Build a real production-quality MVP, not a toy demo.

Prefer simple, durable, production-friendly implementation over clever abstractions.

Do not try to build a full GoHighLevel clone in the first phase.

Do not build these in Phase 1:

- AI chatbot
- Full website builder
- Full visual automation builder
- Mobile app
- Marketplace
- Advanced reporting
- Stripe Connect
- Full Google Calendar two-way sync
- Custom domains
- White-label mobile app

Start with:

Lead capture -> contacts -> pipeline -> basic automation records -> blueprints -> agency/client workspace.

# Session Startup Protocol

At the start of every Claude Code session:

1. Read `CLAUDE.md`.
2. Read `MEMORY.md`.
3. Read the imported project files if present.
4. Inspect `git status` before changing files.
5. Inspect the relevant existing code before editing.
6. Summarize the current state in your own words before implementation.
7. Continue from the last known next steps in `MEMORY.md` unless the user gives different instructions.
8. Do not ask broad open-ended questions before starting. Make reasonable assumptions and proceed.

# End of Session Protocol

At the end of every session, update `MEMORY.md` with:

1. What was built
2. What files changed
3. What commands were run
4. What checks passed
5. What checks failed
6. Known bugs
7. Next best task
8. Any architectural decisions made

Keep `MEMORY.md` concise, factual, and useful for the next session.

# Repository Behavior

Before making changes:

- Run or inspect `git status`.
- Do not overwrite user work without checking the diff.
- Prefer small, coherent changes.
- Keep files modular.
- Do not create giant files when smaller modules are better.
- Do not mark work complete until checks are run or the reason they cannot run is documented.

# Multi-Tenancy Rules

This is a shared-database, shared-schema, multi-tenant SaaS.

Main hierarchy:

UserProfile -> Membership -> Agency -> Tenant / Client Workspace

Definitions:

- Agency: The company using LeadOS to serve clients. Example: Spark Growth Systems.
- Tenant: A client workspace under an agency. Example: BrightSkin Med Spa.
- Blueprint: A reusable niche setup that can be installed into a tenant.
- Contact: A lead or customer inside a tenant workspace.
- Opportunity: A sales/deal record attached to a contact and placed in a pipeline stage.
- Form: A public lead capture form that creates contacts, submissions, and opportunities.
- WorkflowDefinition: A basic automation definition. In v1, store triggerType and actionsJson. Do not build a visual workflow builder yet.

Every client-owned record must include `tenantId`.

Never fetch tenant data without verifying tenant access server-side.

Never rely only on frontend filtering for tenant isolation.

Centralize tenant access checks in reusable server utilities.

# Required Access Utilities

Create and use reusable utilities such as:

- `getCurrentUserProfile()`
- `requireUserProfile()`
- `getAccessibleTenants()`
- `requireTenantAccess(tenantSlug)`
- `requireAgencyAccess(agencyId)`
- `createAuditEvent()`

All tenant-scoped data loading must use these utilities.

# Roles

Create role enums:

- `super_admin`
- `agency_owner`
- `agency_admin`
- `tenant_admin`
- `agent`
- `viewer`

Access rules:

- `super_admin` can access `/admin` and see all agencies and tenants.
- `agency_owner` and `agency_admin` can access their agency, create tenants, manage tenants, and install blueprints.
- `tenant_admin` and `agent` can access assigned tenant data.
- `viewer` is read-only where practical.

If role enforcement is not complete in v1, create the structure and add clear TODOs.

# Hard Security Rules

- Do not remove `tenantId` from client-owned models.
- Do not fetch tenant data without access checks.
- Do not expose service role keys to the browser.
- Do not hardcode secrets.
- Do not commit real API keys.
- Do not skip validation.
- Do not build mock-only flows when real database flows are possible.
- Do not trust route params without verifying access.
- Do not make public form submission capable of writing across tenants incorrectly.
- Add TODOs for Supabase RLS policies if not implemented immediately.

# Required Phase 1 Modules

Build these first:

1. Authentication
2. Agency onboarding
3. Tenant/client workspace creation
4. Workspace switcher
5. Dashboard
6. Contacts CRM
7. Pipelines and opportunities
8. Public lead forms
9. Form submissions
10. Basic automation definitions
11. Blueprint/template system
12. Placeholder inbox
13. Placeholder calendar
14. Placeholder billing
15. Settings and branding placeholders
16. Super-admin placeholder

# Required Public Routes

- `/`
- `/login`
- `/signup`
- `/onboarding`
- `/forms/[formSlug]`

# Required Authenticated App Routes

- `/app`
- `/app/[tenantSlug]/dashboard`
- `/app/[tenantSlug]/contacts`
- `/app/[tenantSlug]/contacts/new`
- `/app/[tenantSlug]/contacts/[contactId]`
- `/app/[tenantSlug]/pipeline`
- `/app/[tenantSlug]/forms`
- `/app/[tenantSlug]/forms/new`
- `/app/[tenantSlug]/forms/[formId]`
- `/app/[tenantSlug]/inbox`
- `/app/[tenantSlug]/calendar`
- `/app/[tenantSlug]/automations`
- `/app/[tenantSlug]/settings`

# Required Agency-Level Routes

- `/app/blueprints`
- `/app/blueprints/new`
- `/app/blueprints/[blueprintId]`
- `/app/billing`

# Required Admin Route

- `/admin`

Protect `/admin` with `ADMIN_EMAILS` or a simple `super_admin` role check placeholder.

# Prisma Models

Use Prisma. Required models are described in `DECISIONS.md` and `PRODUCT_SPEC.md`.

At minimum, create:

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

Use strong relations, indexes, enums, timestamps, and tenant scoping.

# Validation

Use Zod schemas for:

- agency creation
- tenant creation
- contact create/update
- opportunity create/update
- form create/update
- workflow create/update
- blueprint create/update
- settings update

# UI Requirements

Use a modern B2B SaaS dashboard style.

Use:

- shadcn/ui
- Tailwind CSS
- lucide-react icons
- sidebar navigation
- top bar
- tenant switcher
- cards
- tables
- forms
- badges
- empty states
- loading states where practical

Reusable components should include where practical:

- AppSidebar
- Topbar
- TenantSwitcher
- PageHeader
- StatCard
- EmptyState
- ConfirmDeleteDialog
- ContactForm
- OpportunityForm
- FormBuilderSimple
- BlueprintCard
- PipelineBoard
- PipelineColumn
- OpportunityCard

Prioritize clear B2B usability over flashy visuals.

# Blueprint Requirements

Blueprints are reusable niche setups that can be installed into client workspaces.

Seed these system blueprints:

1. Med Spa Lead Follow-Up Blueprint
2. Roofer Estimate Request Blueprint
3. Dentist Appointment Request Blueprint

Blueprints can install:

- pipeline stages
- forms
- workflow definitions
- tags/default settings if practical

Blueprint install should be idempotent where practical.

At minimum:

- If `BlueprintInstall` exists for the tenant, show already installed.
- Do not reinstall endlessly.
- Log audit events.
- Keep all installed records tenant-scoped.

# Forms Requirements

Public form submission must:

1. Find the active form safely.
2. Create or update a contact in the correct tenant.
3. Create a FormSubmission.
4. Create an Opportunity in the default pipeline and first stage.
5. Trigger basic automation placeholder for `triggerType = form_submitted`.
6. Create a WorkflowRun placeholder.
7. Create an AuditEvent.
8. Show a success state.

# Automations Requirements for Phase 1

Do not build a visual workflow builder yet.

Create workflow definitions with:

- name
- triggerType
- actionsJson
- isActive

Supported trigger types for now:

- `form_submitted`
- `opportunity_stage_changed`
- `appointment_booked`

Supported action types as stored JSON only for now:

- `send_sms`
- `send_email`
- `add_tag`
- `create_audit_event`
- `notify_owner`

Execution placeholder should:

- find active workflows by triggerType
- create WorkflowRun
- mark status success or skipped
- log audit event

# Seed Data Requirements

Create seed data described in `SEED_DATA.md`.

Seed script should be safe to rerun where practical.

# Environment Variables

Create `.env.example` using the keys in README and TASKS.

Never expose server-only keys to the browser.

# Checks

Run these where available:

- `npx prisma validate`
- `npx prisma generate`
- `npm run lint`
- `npm run typecheck` if script exists
- `npm run build` if practical

If a check cannot run, document why in the final response and in `MEMORY.md`.

# Final Response Format After Work

When a task is done, respond with:

1. What was built
2. Key files created/changed
3. Commands run
4. Checks passed
5. Checks failed or skipped
6. What is working now
7. What is intentionally placeholder
8. Recommended next task

# First Implementation Order

Follow this order for a fresh repo:

1. Inspect repository
2. Initialize app if needed
3. Install dependencies
4. Configure Tailwind and shadcn/ui
5. Configure Prisma
6. Create database schema
7. Add `.env.example`
8. Add Supabase auth utilities
9. Add user/session/profile utilities
10. Add tenant access utilities
11. Build public landing/login/signup/onboarding
12. Build app shell
13. Build dashboard
14. Build contacts
15. Build pipeline
16. Build forms and public form submission
17. Build automations placeholder
18. Build blueprints
19. Build inbox/calendar/settings/billing/admin placeholders
20. Add seed script
21. Add README
22. Run checks
23. Fix errors
24. Update `MEMORY.md`

# Current North Star

Do the smallest production-quality thing that gets the full loop working:

Agency onboarding -> tenant workspace -> blueprint/form/pipeline -> public form submission -> contact -> opportunity -> workflow run -> consent-gated follow-up -> audit event -> dashboard visibility.
