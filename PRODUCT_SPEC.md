# LeadOS Product Spec

## Product Summary

LeadOS is a white-label CRM and agency software builder for agencies that serve local businesses.

It helps an agency launch its own branded lead capture, follow-up, and pipeline management software.

## Core User

The main user is an agency owner who wants to sell a branded CRM and lead follow-up system to clients.

Secondary users include:

- agency admins
- client business owners
- client staff members
- sales reps
- appointment setters

## Core Customer

The agency's client is usually a local service business, such as:

- med spa
- roofer
- dentist
- chiropractor
- real estate team
- auto detailer
- legal intake firm
- home service company

## Core Workflow

1. Agency signs up.
2. Agency creates an agency profile.
3. Agency creates a client workspace.
4. Agency installs a niche blueprint.
5. Blueprint creates forms, pipeline stages, automations, and default settings.
6. A lead submits a public form.
7. Lead becomes a contact.
8. Contact gets an opportunity.
9. Opportunity appears in the pipeline.
10. Workflow automation runs.
11. Consented SMS/email follow-up is logged into the conversation history.
12. Agency or client manages the lead.

## MVP Success Criteria

The MVP is successful when this full loop works:

Public form submission -> contact created -> form submission created -> opportunity created -> opportunity appears in pipeline -> workflow run created -> audit event created -> dashboard stats update.

## Phase 1 Features

### Authentication

Users can sign up, log in, and access the app.

### Onboarding

After signup, a user can create:

- agency
- first tenant/client workspace
- default pipeline

### Agency and Tenant Structure

An agency can have many tenants/client workspaces.

A tenant contains client-owned CRM data.

### Contacts

Users can:

- list contacts
- search contacts where practical
- create contacts
- edit contacts
- delete contacts
- view contact details
- manage tags and notes

### Pipeline

Users can:

- view opportunities grouped by stage
- create opportunities
- edit opportunities
- move opportunities between stages

### Forms

Users can:

- create forms
- edit forms
- view public form URL
- see embed code placeholder

Public visitors can submit active forms.

### Form Submission Behavior

When a form is submitted:

1. Create or update contact.
2. Create form submission.
3. Create opportunity.
4. Trigger matching workflows.
5. Create workflow run.
6. Create audit event.
7. Show success message.

### Workflow Definitions

Users can create basic workflow definitions with:

- name
- triggerType
- actionsJson
- isActive

No visual workflow builder in Phase 1.

## Phase 2 Messaging Features

Users can:

- send SMS from a contact profile when SMS consent and phone number exist
- send email from a contact profile when email consent and email address exist
- view per-contact conversation history
- view all recent conversations in Inbox
- configure a tenant Twilio number in Settings

System behavior:

- public forms collect explicit SMS/email opt-in
- workflow actions can send SMS/email through provider adapters
- outbound messages are logged before dispatch
- inbound Twilio SMS is routed by tenant Twilio number
- Twilio `STOP` revokes SMS consent
- Resend delivery events verify Svix signatures before status updates

### Blueprints

Users can view and install blueprints.

System blueprints:

1. Med Spa Lead Follow-Up Blueprint
2. Roofer Estimate Request Blueprint
3. Dentist Appointment Request Blueprint

### Placeholder Modules

Create UI placeholders for:

- inbox
- calendar
- billing
- settings
- admin

## Do Not Build Yet

Do not build these in Phase 1:

- full visual workflow builder
- AI chatbot
- public API/MCP access
- x402 payment gates
- mobile app
- website builder
- marketplace
- custom domains
- white-label mobile app
- full Google Calendar sync
- advanced reporting
- Stripe Connect
- complex role UI

## Product Positioning

LeadOS should feel like a platform an agency can use to sell:

- lead capture systems
- appointment booking systems
- automated follow-up systems
- pipeline tracking systems
- niche CRM snapshots/blueprints

## First Niche Target

Start with med spas.

Med Spa Blueprint should include:

- consultation request form
- med spa pipeline stages
- form_submitted workflow definition
- sample SMS/email copy in actionsJson
- consultation-lead tag if practical

## Main Buyer Outcome

The agency should be able to say:

We install a branded CRM that captures new leads, follows up instantly, tracks them in a pipeline, and helps you book more appointments.
