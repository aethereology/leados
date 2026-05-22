import { requireTenantAccess } from "@/lib/access";
import { PageHeader } from "@/components/app/PageHeader";
import { FormBuilderSimple } from "@/components/forms/FormBuilderSimple";
import { createFormAction } from "../actions";

export default async function NewFormPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  await requireTenantAccess(params.tenantSlug);
  const action = createFormAction.bind(null, params.tenantSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New form"
        description="Lead capture form — submissions create a contact, form submission, opportunity, and workflow run."
      />
      <FormBuilderSimple action={action} submitLabel="Create form" />
    </div>
  );
}
