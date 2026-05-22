"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import type { OpportunityFormState } from "@/app/app/[tenantSlug]/pipeline/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create opportunity"}
    </Button>
  );
}

export function OpportunityForm({
  pipelineId,
  stages,
  contacts,
  action,
}: {
  pipelineId: string;
  stages: { id: string; name: string }[];
  contacts: { id: string; label: string }[];
  action: (
    prev: OpportunityFormState | undefined,
    formData: FormData,
  ) => Promise<OpportunityFormState>;
}) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-5 max-w-xl">
      <input type="hidden" name="pipelineId" value={pipelineId} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={180} placeholder="Sarah Miller Botox Consultation" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="stageId">Stage</Label>
          <SelectNative id="stageId" name="stageId" required>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SelectNative>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="value">Value</Label>
          <Input id="value" name="value" type="number" min={0} step="0.01" placeholder="500" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactId">Contact (optional)</Label>
        <SelectNative id="contactId" name="contactId">
          <option value="">— None —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </SelectNative>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="source">Source</Label>
        <Input id="source" name="source" placeholder="form, referral, website…" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
