"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { MessageComposerState } from "@/app/app/[tenantSlug]/contacts/actions";

function SubmitButton({ channel }: { channel: "sms" | "email" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : channel === "sms" ? "Send SMS" : "Send email"}
    </Button>
  );
}

export function MessageComposer({
  action,
  canSms,
  canEmail,
}: {
  action: (
    prev: MessageComposerState | undefined,
    formData: FormData,
  ) => Promise<MessageComposerState>;
  canSms: boolean;
  canEmail: boolean;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const defaultChannel: "sms" | "email" = canSms ? "sms" : canEmail ? "email" : "sms";
  const [channel, setChannel] = useState<"sms" | "email">(defaultChannel);

  if (!canSms && !canEmail) {
    return (
      <p className="text-sm text-muted-foreground">
        This contact has no phone or email on file, or has not consented to either channel. Update
        the contact above to send messages.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" key={state?.success ?? ""}>
      <div className="flex gap-2">
        {canSms && (
          <button
            type="button"
            onClick={() => setChannel("sms")}
            className={`text-sm rounded-md border px-3 py-1.5 ${
              channel === "sms" ? "bg-foreground text-background" : "bg-background"
            }`}
          >
            SMS
          </button>
        )}
        {canEmail && (
          <button
            type="button"
            onClick={() => setChannel("email")}
            className={`text-sm rounded-md border px-3 py-1.5 ${
              channel === "email" ? "bg-foreground text-background" : "bg-background"
            }`}
          >
            Email
          </button>
        )}
      </div>

      <input type="hidden" name="channel" value={channel} />

      {channel === "email" && (
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" maxLength={180} placeholder="(optional)" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          name="body"
          rows={5}
          required
          maxLength={4000}
          placeholder={
            channel === "sms"
              ? "Hey {firstName}, thanks for reaching out…"
              : "Write your email body here…"
          }
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}

      <SubmitButton channel={channel} />
    </form>
  );
}
