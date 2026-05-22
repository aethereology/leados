"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess, canWriteTenant } from "@/lib/access";
import { createAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import type { FormFieldInput } from "@/lib/zod-schemas";

export type FormFormState = { error?: string };

function readFields(fd: FormData): FormFieldInput[] {
  // Fields arrive as parallel arrays: fieldName[], fieldLabel[], fieldType[],
  // fieldRequired[]. The builder emits a hidden input per row for
  // fieldRequired so the arrays line up by index regardless of checkbox state.
  const names = fd.getAll("fieldName").map((v) => String(v ?? "").trim());
  const labels = fd.getAll("fieldLabel").map((v) => String(v ?? "").trim());
  const types = fd.getAll("fieldType").map((v) => String(v ?? "").trim());
  const required = fd
    .getAll("fieldRequired")
    .map((v) => v === "true" || v === "on");

  const fields: FormFieldInput[] = [];
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    if (!name) continue;
    const type = (types[i] as FormFieldInput["type"]) ?? "text";
    fields.push({
      name,
      label: labels[i] || name,
      type,
      required: !!required[i],
    });
  }
  return fields;
}

async function uniqueFormSlug(base: string): Promise<string> {
  let slug = base || "form";
  let n = 1;
  while (await prisma.form.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function createFormAction(
  tenantSlug: string,
  _prev: FormFormState | undefined,
  formData: FormData,
): Promise<FormFormState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return { error: "You don't have permission to create forms." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Form name must be at least 2 characters." };

  const fields = readFields(formData);
  if (fields.length === 0) return { error: "Add at least one field to the form." };

  const baseSlug = `${tenant.slug}-${slugify(name)}`;
  const slug = await uniqueFormSlug(baseSlug);

  const form = await prisma.form.create({
    data: {
      tenantId: tenant.id,
      name,
      slug,
      schemaJson: { fields },
      isActive: true,
    },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "form.create",
    targetType: "Form",
    targetId: form.id,
  });

  revalidatePath(`/app/${tenant.slug}/forms`);
  redirect(`/app/${tenant.slug}/forms/${form.id}`);
}

export async function updateFormAction(
  tenantSlug: string,
  formId: string,
  _prev: FormFormState | undefined,
  formData: FormData,
): Promise<FormFormState> {
  const { tenant, membership, profile } = await requireTenantAccess(tenantSlug);
  if (!canWriteTenant(membership)) return { error: "You don't have permission to edit forms." };

  const existing = await prisma.form.findFirst({
    where: { id: formId, tenantId: tenant.id },
  });
  if (!existing) return { error: "Form not found." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Form name must be at least 2 characters." };

  const fields = readFields(formData);
  if (fields.length === 0) return { error: "Add at least one field." };

  const isActive = formData.get("isActive") === "on";

  await prisma.form.update({
    where: { id: existing.id },
    data: {
      name,
      schemaJson: { fields },
      isActive,
    },
  });

  await createAuditEvent({
    tenantId: tenant.id,
    userProfileId: profile.id,
    action: "form.update",
    targetType: "Form",
    targetId: existing.id,
  });

  revalidatePath(`/app/${tenant.slug}/forms`);
  revalidatePath(`/app/${tenant.slug}/forms/${existing.id}`);
  return {};
}
