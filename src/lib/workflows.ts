import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, WorkflowTriggerType } from "@prisma/client";
import { createAuditEvent } from "@/lib/audit";
import { renderTemplate, sendOutboundMessage } from "@/lib/messaging";

/**
 * Workflow execution. As of Phase 2 we actually dispatch `send_sms` and
 * `send_email` actions through the provider adapters in `src/lib/providers`.
 *
 * For each matching active workflow we:
 *   - render template variables against the workflow context
 *   - execute each action (or skip with a recorded reason)
 *   - create one WorkflowRun row with the full per-action outcome list
 *   - record an audit event
 *
 * Unknown action types are recorded as "skipped" rather than failing the whole
 * run, so a single bad action doesn't break form submissions.
 */
export type WorkflowContext = {
  tenantId: string;
  contactId?: string | null;
  opportunityId?: string | null;
  formSubmissionId?: string | null;
  payload?: Record<string, unknown> | null;
};

type ActionOutcome = {
  type: string;
  status: "executed" | "skipped" | "failed";
  detail?: string;
  messageId?: string;
};

type RawAction = {
  type?: string;
  body?: string;
  subject?: string;
  tag?: string;
  [k: string]: unknown;
};

function buildVars(
  context: WorkflowContext,
  contact: { firstName: string | null; lastName: string | null; email: string | null; phone: string | null } | null,
): Record<string, string | null | undefined> {
  const vars: Record<string, string | null | undefined> = {};
  if (contact) {
    vars.firstName = contact.firstName ?? "";
    vars.lastName = contact.lastName ?? "";
    vars.email = contact.email ?? "";
    vars.phone = contact.phone ?? "";
  }
  if (context.payload && typeof context.payload === "object") {
    for (const [k, v] of Object.entries(context.payload)) {
      if (vars[k] === undefined) {
        vars[k] = v == null ? "" : String(v);
      }
    }
  }
  return vars;
}

export async function runWorkflowsForTrigger(
  triggerType: WorkflowTriggerType,
  context: WorkflowContext,
) {
  const workflows = await prisma.workflowDefinition.findMany({
    where: {
      tenantId: context.tenantId,
      triggerType,
      isActive: true,
    },
  });

  const contact = context.contactId
    ? await prisma.contact.findFirst({
        where: { id: context.contactId, tenantId: context.tenantId },
      })
    : null;

  const vars = buildVars(context, contact);

  const runs = [];
  for (const w of workflows) {
    const rawActions = Array.isArray(w.actionsJson) ? (w.actionsJson as RawAction[]) : [];
    const outcomes: ActionOutcome[] = [];
    let runStatus: "success" | "failed" = "success";

    for (const action of rawActions) {
      const type = String(action?.type ?? "");
      try {
        if (type === "send_sms") {
          if (!contact) {
            outcomes.push({ type, status: "skipped", detail: "No contact in workflow context" });
            continue;
          }
          const body = renderTemplate(String(action.body ?? ""), vars);
          const result = await sendOutboundMessage({
            tenantId: context.tenantId,
            contact,
            channel: "sms",
            body,
          });
          if (result.ok) {
            outcomes.push({ type, status: "executed", messageId: result.message.id });
          } else {
            if (result.reason === "send_failed") {
              runStatus = "failed";
              outcomes.push({ type, status: "failed", detail: result.detail });
            } else {
              outcomes.push({ type, status: "skipped", detail: result.detail });
            }
          }
        } else if (type === "send_email") {
          if (!contact) {
            outcomes.push({ type, status: "skipped", detail: "No contact in workflow context" });
            continue;
          }
          const subject = renderTemplate(String(action.subject ?? "Follow-up"), vars).trim() || "Follow-up";
          const body = renderTemplate(String(action.body ?? ""), vars);
          const result = await sendOutboundMessage({
            tenantId: context.tenantId,
            contact,
            channel: "email",
            body,
            subject,
          });
          if (result.ok) {
            outcomes.push({ type, status: "executed", messageId: result.message.id });
          } else {
            if (result.reason === "send_failed") {
              runStatus = "failed";
              outcomes.push({ type, status: "failed", detail: result.detail });
            } else {
              outcomes.push({ type, status: "skipped", detail: result.detail });
            }
          }
        } else if (type === "add_tag") {
          if (!contact) {
            outcomes.push({ type, status: "skipped", detail: "No contact in workflow context" });
            continue;
          }
          const tag = String(action.tag ?? "").trim();
          if (!tag) {
            outcomes.push({ type, status: "skipped", detail: "Empty tag" });
            continue;
          }
          if (!contact.tags.includes(tag)) {
            await prisma.contact.update({
              where: { id: contact.id },
              data: { tags: { set: [...contact.tags, tag] } },
            });
            contact.tags = [...contact.tags, tag];
          }
          outcomes.push({ type, status: "executed", detail: `tag=${tag}` });
        } else if (type === "create_audit_event" || type === "notify_owner") {
          // Phase 2: still placeholders. notify_owner will land in Phase 3 with
          // tenant-owner resolution + email delivery.
          outcomes.push({ type, status: "skipped", detail: "Placeholder action — not dispatched in Phase 2" });
        } else {
          outcomes.push({ type, status: "skipped", detail: `Unknown action type "${type}"` });
        }
      } catch (err) {
        runStatus = "failed";
        outcomes.push({
          type,
          status: "failed",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const run = await prisma.workflowRun.create({
      data: {
        tenantId: context.tenantId,
        workflowId: w.id,
        triggerType,
        status: runStatus,
        contextJson: {
          contactId: context.contactId ?? null,
          opportunityId: context.opportunityId ?? null,
          formSubmissionId: context.formSubmissionId ?? null,
          payload: context.payload ?? null,
        } as Prisma.InputJsonValue,
        resultJson: {
          actions: outcomes,
        } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
    runs.push(run);

    await createAuditEvent({
      tenantId: context.tenantId,
      action: "workflow.run",
      targetType: "WorkflowRun",
      targetId: run.id,
      metadata: { workflowId: w.id, triggerType, status: runStatus, actionCount: outcomes.length },
    });
  }

  return runs;
}
