"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { FormFormState } from "@/app/app/[tenantSlug]/forms/actions";

type FieldRow = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required: boolean;
};

const STARTER_FIELDS: FieldRow[] = [
  { name: "firstName", label: "First name", type: "text", required: true },
  { name: "lastName", label: "Last name", type: "text", required: false },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true },
  { name: "message", label: "Message", type: "textarea", required: false },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function FormBuilderSimple({
  action,
  initial,
  submitLabel = "Save form",
  showActiveToggle = false,
}: {
  action: (
    prev: FormFormState | undefined,
    formData: FormData,
  ) => Promise<FormFormState>;
  initial?: { name?: string; isActive?: boolean; fields?: FieldRow[] };
  submitLabel?: string;
  showActiveToggle?: boolean;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const [fields, setFields] = useState<FieldRow[]>(
    initial?.fields && initial.fields.length > 0
      ? initial.fields.map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: !!f.required,
        }))
      : STARTER_FIELDS,
  );

  function update(i: number, patch: Partial<FieldRow>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function remove(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setFields((prev) => [
      ...prev,
      { name: `field${prev.length + 1}`, label: `Field ${prev.length + 1}`, type: "text", required: false },
    ]);
  }

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      <div className="space-y-1.5">
        <Label htmlFor="name">Form name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          required
          minLength={2}
          maxLength={120}
          placeholder="Consultation Request Form"
        />
      </div>

      {showActiveToggle && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial?.isActive ?? true}
            className="h-4 w-4 rounded border"
          />
          Active (accepting public submissions)
        </label>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Fields</Label>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            Add field
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="grid gap-2 md:grid-cols-12 items-end">
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs" htmlFor={`name-${i}`}>Name</Label>
                    <Input
                      id={`name-${i}`}
                      name="fieldName"
                      value={f.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="firstName"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs" htmlFor={`label-${i}`}>Label</Label>
                    <Input
                      id={`label-${i}`}
                      name="fieldLabel"
                      value={f.label}
                      onChange={(e) => update(i, { label: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs" htmlFor={`type-${i}`}>Type</Label>
                    <SelectNative
                      id={`type-${i}`}
                      name="fieldType"
                      value={f.type}
                      onChange={(e) => update(i, { type: e.target.value as FieldRow["type"] })}
                    >
                      <option value="text">text</option>
                      <option value="email">email</option>
                      <option value="tel">tel</option>
                      <option value="textarea">textarea</option>
                      <option value="select">select</option>
                    </SelectNative>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    {/* Always submit one entry per row so the parallel arrays
                        in the server action stay aligned, even when a row's
                        "required" is false. The browser-only checkbox drives
                        the UX; the hidden input is the source of truth that
                        actually reaches the server. */}
                    <input
                      type="hidden"
                      name="fieldRequired"
                      value={f.required ? "true" : "false"}
                    />
                    <input
                      id={`req-${i}`}
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => update(i, { required: e.target.checked })}
                      className="h-4 w-4 rounded border"
                    />
                    <Label className="text-xs" htmlFor={`req-${i}`}>Required</Label>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(i)}
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
