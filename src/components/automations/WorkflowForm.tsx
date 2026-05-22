"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import type { WorkflowFormState } from "@/app/app/[tenantSlug]/automations/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Create workflow"}
    </Button>
  );
}

export function WorkflowForm({
  action,
  defaultActionsJson,
}: {
  action: (
    prev: WorkflowFormState | undefined,
    formData: FormData,
  ) => Promise<WorkflowFormState>;
  defaultActionsJson: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required minLength={2} maxLength={120} placeholder="New Consultation Lead Follow-Up" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="triggerType">Trigger</Label>
        <SelectNative id="triggerType" name="triggerType" required defaultValue="form_submitted">
          <option value="form_submitted">form_submitted</option>
          <option value="opportunity_stage_changed">opportunity_stage_changed</option>
          <option value="appointment_booked">appointment_booked</option>
        </SelectNative>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="actionsJson">Actions (JSON array)</Label>
        <Textarea
          id="actionsJson"
          name="actionsJson"
          rows={14}
          required
          defaultValue={defaultActionsJson}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Supported types: send_sms, send_email, add_tag, create_audit_event, notify_owner.
          SMS and email send through the configured providers when the contact has consent.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border" />
        Active
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Submit />
    </form>
  );
}
