"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ContactFormState } from "@/app/app/[tenantSlug]/contacts/actions";

type Contact = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  tags?: string[];
  notes?: string | null;
  consentSms?: boolean;
  consentEmail?: boolean;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ContactForm({
  initial,
  action,
  submitLabel = "Save contact",
}: {
  initial?: Contact;
  action: (
    prev: ContactFormState | undefined,
    formData: FormData,
  ) => Promise<ContactFormState>;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" defaultValue={initial?.firstName ?? ""} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" defaultValue={initial?.lastName ?? ""} maxLength={80} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} maxLength={180} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={initial?.phone ?? ""} maxLength={40} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" defaultValue={initial?.source ?? ""} placeholder="manual, form, referral…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" name="tags" defaultValue={(initial?.tags ?? []).join(", ")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={initial?.notes ?? ""} maxLength={4000} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="consentSms"
            defaultChecked={initial?.consentSms ?? false}
            className="h-4 w-4 rounded border"
          />
          Consents to SMS
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="consentEmail"
            defaultChecked={initial?.consentEmail ?? false}
            className="h-4 w-4 rounded border"
          />
          Consents to email
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
