# LeadOS Test Plan

## Technical Checks

Run where available:

```bash
npx prisma validate
npm run lint
npm run typecheck
npx next build
```

Also run `npm run build` after closing running Next/node processes. On Windows, `prisma generate` can fail with EPERM if Prisma's query engine DLL is locked by an app server.

## Manual Test: Onboarding

1. Open signup page.
2. Create a new user.
3. Complete onboarding.
4. Create agency.
5. Create first tenant/client workspace.
6. Confirm default pipeline exists.
7. Confirm redirect to tenant dashboard.

Expected result:

User lands on `/app/[tenantSlug]/dashboard` and sees empty or seeded stats.

## Manual Test: Contacts

1. Open contacts page.
2. Create contact with phone, email, tags, notes, SMS consent, and email consent.
3. Confirm phone is saved in normalized E.164-style format where possible.
4. Edit contact.
5. Confirm contact detail page loads.
6. Delete contact if delete is available.

Expected result:

Contact data is tenant-scoped and visible only in the correct workspace.

## Manual Test: Forms

1. Open forms page.
2. Create or use an active form with phone and email fields.
3. Copy public form URL.
4. Open public form URL in logged-out or private browser.
5. Submit test lead with SMS/email opt-in checked.
6. Confirm success state.
7. Return to app.
8. Confirm contact was created or updated.
9. Confirm SMS/email consent matches the opt-in choices.
10. Confirm form submission was created.
11. Confirm opportunity was created.
12. Confirm workflow run was created.
13. Confirm audit event was created.

Expected result:

Public form submission creates all expected tenant-scoped records and only grants messaging consent from explicit opt-in.

## Manual Test: Pipeline

1. Open pipeline page.
2. Create opportunity.
3. Assign contact.
4. Set value.
5. Move opportunity to another stage.
6. Refresh page.
7. Confirm opportunity remains in correct stage.
8. Confirm dashboard stats update.

Expected result:

Opportunity appears under the selected pipeline stage.

## Manual Test: Messaging Composer

1. Open a contact detail page.
2. Ensure contact has a phone number and `consentSms=true`.
3. Send SMS.
4. Ensure contact has an email address and `consentEmail=true`.
5. Send email.
6. Open Inbox.

Expected result:

Messages are sent when providers are configured, or recorded as queued/stubbed when provider credentials are missing. Contact conversation history and Inbox both update.

## Manual Test: Resend Webhook

1. Expose local app with a tunnel, such as `ngrok http 3000`.
2. In Resend, set webhook endpoint to `https://YOUR-TUNNEL/api/webhooks/resend`.
3. Select `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.failed`, and `email.delivery_delayed`.
4. Copy Resend's signing secret into `RESEND_WEBHOOK_SECRET`.
5. Restart the app server.
6. Send an email from a contact detail page.

Expected result:

Unsigned webhook requests return 403. Signed Resend events update the matching Message status by provider message id.

## Manual Test: Twilio SMS and STOP

1. In tenant Settings, set the tenant Twilio number in E.164 format.
2. Configure Twilio inbound SMS webhook to `/api/webhooks/twilio/sms`.
3. Configure Twilio status callback webhook to `/api/webhooks/twilio/status`.
4. Send SMS from a contact detail page to a real phone.
5. Reply from the phone.
6. Reply `STOP`.

Expected result:

Outbound SMS is logged, inbound SMS appears in the matching contact conversation, status callbacks update the message, and `STOP` revokes SMS consent.

## Manual Test: Automations

1. Open automations page.
2. Create workflow definition with `triggerType = form_submitted`.
3. Include `send_sms`, `send_email`, and `add_tag` actions.
4. Submit public form with matching consent.
5. Confirm workflow run status and action outcomes.

Expected result:

Successful provider sends are `executed`. Missing consent/destination outcomes are `skipped`. Provider send failures mark the action and run as `failed`.

## Manual Test: Blueprints

1. Open blueprints page.
2. View Med Spa Lead Follow-Up Blueprint.
3. Install blueprint into tenant.
4. Confirm pipeline/stages were created.
5. Confirm form was created.
6. Confirm workflow definition was created.
7. Try installing again.
8. Confirm duplicate install is prevented.

Expected result:

Blueprint install is idempotent enough for the current phase.

## Manual Test: Tenant Isolation

1. Create two tenants under the same agency.
2. Create contacts, forms, conversations, and workflows in tenant A.
3. Create contacts, forms, conversations, and workflows in tenant B.
4. Switch between tenants.
5. Confirm tenant A cannot see tenant B's data and vice versa.

Expected result:

Tenant data is isolated server-side.

## Manual Test: Placeholder Pages

Open:

- calendar
- billing
- admin

Expected result:

Pages load with useful placeholder UI and no crashes.

## Regression Checklist

Before ending a session:

- No obvious TypeScript errors.
- No broken imports.
- No unhandled route crashes in core routes.
- No tenant-scoped query without access utility or trusted webhook tenant lookup.
- `MEMORY.md` updated.
