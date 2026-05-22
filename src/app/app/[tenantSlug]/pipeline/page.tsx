import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export default async function PipelinePage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);

  const pipeline = await prisma.pipeline.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
    include: {
      stages: {
        orderBy: { position: "asc" },
        include: {
          opportunities: {
            where: { tenantId: tenant.id },
            include: { contact: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!pipeline) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipeline" />
        <EmptyState
          title="No pipeline configured"
          description="Install a blueprint or create a default pipeline to start tracking opportunities."
          action={
            <Button asChild>
              <Link href="/app/blueprints">Browse blueprints</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={`${pipeline.name} · move opportunities between stages`}
        actions={
          <Button asChild>
            <Link href={`/app/${tenant.slug}/pipeline/new`}>New opportunity</Link>
          </Button>
        }
      />

      <PipelineBoard
        tenantSlug={tenant.slug}
        stages={pipeline.stages.map((s) => ({
          id: s.id,
          name: s.name,
          opportunities: s.opportunities.map((o) => ({
            id: o.id,
            title: o.title,
            value: o.value?.toString() ?? null,
            status: o.status,
            contactName:
              [o.contact?.firstName, o.contact?.lastName].filter(Boolean).join(" ") ||
              o.contact?.email ||
              o.contact?.phone ||
              null,
            contactId: o.contactId,
          })),
        }))}
      />
    </div>
  );
}
