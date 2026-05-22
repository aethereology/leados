"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeOnboardingAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating workspace…" : "Create agency & workspace"}
    </Button>
  );
}

export function OnboardingForm() {
  const [state, action] = useFormState(completeOnboardingAction, undefined);
  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="agencyName">Agency name</Label>
            <Input
              id="agencyName"
              name="agencyName"
              placeholder="Spark Growth Systems"
              required
              minLength={2}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              This is the company using LeadOS to serve clients.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tenantName">First client workspace</Label>
            <Input
              id="tenantName"
              name="tenantName"
              placeholder="BrightSkin Med Spa"
              required
              minLength={2}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              We'll spin up a default sales pipeline inside this workspace.
            </p>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
