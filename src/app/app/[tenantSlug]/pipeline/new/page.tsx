import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { OpportunityForm } from "@/components/pipeline/OpportunityForm";
import { createOpportunityAction } from "../actions";

export default async function NewOpportunityPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);

  const pipeline = await prisma.pipeline.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
    include: { stages: { orderBy: { position: "asc" } } },
  });

  if (!pipeline) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="New opportunity"
          description="No default pipeline configured for this workspace."
          actions={
            <Button asChild variant="outline">
              <Link href={`/app/${tenant.slug}/pipeline`}>Back</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const contacts = await prisma.contact.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });

  const action = createOpportunityAction.bind(null, params.tenantSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New opportunity"
        description="Create a deal and place it in a pipeline stage."
        actions={
          <Button asChild variant="outline">
            <Link href={`/app/${tenant.slug}/pipeline`}>Back</Link>
          </Button>
        }
      />
      <OpportunityForm
        pipelineId={pipeline.id}
        stages={pipeline.stages.map((s) => ({ id: s.id, name: s.name }))}
        contacts={contacts.map((c) => ({
          id: c.id,
          label:
            [c.firstName, c.lastName].filter(Boolean).join(" ") ||
            c.email ||
            c.phone ||
            c.id,
        }))}
        action={action}
      />
    </div>
  );
}
