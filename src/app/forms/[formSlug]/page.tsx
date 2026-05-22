import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicFormView } from "./PublicFormView";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
}: {
  params: { formSlug: string };
}) {
  const form = await prisma.form.findUnique({
    where: { slug: params.formSlug },
    include: { tenant: { select: { name: true } } },
  });

  if (!form || !form.isActive) notFound();

  const schema = form.schemaJson as {
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "email" | "tel" | "textarea" | "select";
      required?: boolean;
      placeholder?: string;
      options?: string[];
    }>;
  };

  return (
    <PublicFormView
      formSlug={form.slug}
      formName={form.name}
      tenantName={form.tenant.name}
      fields={schema.fields ?? []}
    />
  );
}
