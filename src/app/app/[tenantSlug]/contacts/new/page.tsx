import { requireTenantAccess } from "@/lib/access";
import { PageHeader } from "@/components/app/PageHeader";
import { ContactForm } from "@/components/contacts/ContactForm";
import { createContactAction } from "../actions";

export default async function NewContactPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  await requireTenantAccess(params.tenantSlug);
  const action = createContactAction.bind(null, params.tenantSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New contact"
        description="Manually add a lead or customer to this workspace."
      />
      <ContactForm action={action} submitLabel="Create contact" />
    </div>
  );
}
