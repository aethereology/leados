"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { submitPublicFormAction } from "./submit";

type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Submitting…" : "Submit"}
    </Button>
  );
}

export function PublicFormView({
  formSlug,
  formName,
  tenantName,
  fields,
}: {
  formSlug: string;
  formName: string;
  tenantName: string;
  fields: Field[];
}) {
  const action = submitPublicFormAction.bind(null, formSlug);
  const [state, formAction] = useFormState(action, undefined);
  const hasPhoneField = fields.some(
    (f) => f.type === "tel" || f.name.toLowerCase().includes("phone"),
  );
  const hasEmailField = fields.some(
    (f) => f.type === "email" || f.name.toLowerCase().includes("email"),
  );

  if (state?.ok) {
    return (
      <main className="min-h-screen grid place-items-center px-4 py-12 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h1 className="text-xl font-semibold">Thanks for reaching out!</h1>
            <p className="text-sm text-muted-foreground">
              {tenantName} received your submission and will follow up shortly.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-12 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">{formName}</CardTitle>
          <p className="text-sm text-muted-foreground">{tenantName}</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    name={f.name}
                    required={f.required}
                    placeholder={f.placeholder}
                    rows={4}
                  />
                ) : f.type === "select" ? (
                  <SelectNative
                    id={f.name}
                    name={f.name}
                    required={f.required}
                    defaultValue=""
                  >
                    <option value="" disabled>Choose…</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </SelectNative>
                ) : (
                  <Input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    required={f.required}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}

            {(hasPhoneField || hasEmailField) && (
              <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                {hasPhoneField && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="consentSms"
                      className="mt-0.5 h-4 w-4 rounded border"
                    />
                    <span>
                      I agree to receive text messages about this request. Message and data rates
                      may apply.
                    </span>
                  </label>
                )}
                {hasEmailField && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="consentEmail"
                      className="mt-0.5 h-4 w-4 rounded border"
                    />
                    <span>I agree to receive emails about this request.</span>
                  </label>
                )}
              </div>
            )}

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Submit />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
