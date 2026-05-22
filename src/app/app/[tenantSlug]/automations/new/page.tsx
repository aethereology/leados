import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { WorkflowForm } from "@/components/automations/WorkflowForm";
import { createWorkflowAction } from "../actions";

const DEFAULT_ACTIONS = JSON.stringify(
  [
    {
      type: "send_sms",
      body: "Hey {{firstName}}, thanks for reaching out. Want to chat this week?",
    },
    {
      type: "send_email",
      subject: "We received your request",
      body: "Thanks for reaching out — we'll follow up shortly.",
    },
    { type: "add_tag", tag: "form-lead" },
  ],
  null,
  2,
);

export default async function NewAutomationPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  await requireTenantAccess(params.tenantSlug);
  const action = createWorkflowAction.bind(null, params.tenantSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New workflow"
        description="Define a trigger and actions. SMS and email actions dispatch when provider credentials and contact consent are present."
        actions={
          <Button asChild variant="outline">
            <Link href={`/app/${params.tenantSlug}/automations`}>Back</Link>
          </Button>
        }
      />
      <WorkflowForm action={action} defaultActionsJson={DEFAULT_ACTIONS} />
    </div>
  );
}
