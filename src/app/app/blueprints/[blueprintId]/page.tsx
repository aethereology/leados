import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserProfile, getAccessibleTenants } from "@/lib/access";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlueprintInstallForm } from "@/components/blueprints/BlueprintInstallForm";
import { installBlueprintAction } from "../actions";

export default async function BlueprintDetailPage({
  params,
}: {
  params: { blueprintId: string };
}) {
  const profile = await requireUserProfile();
  const tenants = await getAccessibleTenants(profile.id);

  const blueprint = await prisma.blueprint.findUnique({
    where: { id: params.blueprintId },
    include: {
      items: { orderBy: { position: "asc" } },
      installs: { select: { tenantId: true } },
    },
  });
  if (!blueprint) notFound();

  // gate visibility: must be system blueprint OR owned by one of the user's agencies
  const allowedAgencyIds = new Set(tenants.map((t) => t.agencyId));
  if (
    blueprint.ownerType === "agency" &&
    blueprint.agencyId &&
    !allowedAgencyIds.has(blueprint.agencyId)
  ) {
    notFound();
  }

  const installedTenantIds = new Set(blueprint.installs.map((i) => i.tenantId));

  const action = installBlueprintAction.bind(null, blueprint.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={blueprint.name}
        description={blueprint.description ?? "Reusable niche setup"}
        actions={
          <Button asChild variant="outline">
            <Link href="/app/blueprints">Back</Link>
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{blueprint.ownerType}</Badge>
        {blueprint.niche && <Badge variant="outline">{blueprint.niche}</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What gets installed</CardTitle>
        </CardHeader>
        <CardContent>
          {blueprint.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items defined.</p>
          ) : (
            <ul className="divide-y text-sm">
              {blueprint.items.map((item) => (
                <li key={item.id} className="py-2 flex items-center justify-between">
                  <span className="capitalize">{item.itemType}</span>
                  <span className="text-xs text-muted-foreground">
                    {(item.payloadJson as Record<string, unknown>)?.name as string ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Install into a workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <BlueprintInstallForm
            action={action}
            tenants={tenants.map((t) => ({
              id: t.id,
              label: `${t.agency.name} · ${t.name}`,
              alreadyInstalled: installedTenantIds.has(t.id),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
