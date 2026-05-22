"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Button } from "@/components/ui/button";
import type { InstallState } from "@/app/app/blueprints/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Installing…" : "Install blueprint"}
    </Button>
  );
}

export function BlueprintInstallForm({
  action,
  tenants,
}: {
  action: (
    prev: InstallState | undefined,
    formData: FormData,
  ) => Promise<InstallState>;
  tenants: { id: string; label: string; alreadyInstalled: boolean }[];
}) {
  const [state, formAction] = useFormState(action, undefined);

  if (tenants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a client workspace first, then return here to install this blueprint.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="tenantId">Workspace</Label>
        <SelectNative id="tenantId" name="tenantId" required defaultValue="">
          <option value="" disabled>Choose a workspace…</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id} disabled={t.alreadyInstalled}>
              {t.label} {t.alreadyInstalled ? "(already installed)" : ""}
            </option>
          ))}
        </SelectNative>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.alreadyInstalled && (
        <p className="text-sm text-amber-700">
          This blueprint is already installed in that workspace.
        </p>
      )}
      {state?.ok && state.installedTenantSlug && (
        <p className="text-sm text-emerald-700">
          Installed! Visit{" "}
          <Link
            href={`/app/${state.installedTenantSlug}/dashboard`}
            className="underline underline-offset-4"
          >
            the workspace dashboard
          </Link>{" "}
          to see the new pipeline, form, and workflow.
        </p>
      )}
      <Submit />
    </form>
  );
}
