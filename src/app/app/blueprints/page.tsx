import Link from "next/link";
import { requireUserProfile, getAccessibleTenants } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";

export default async function BlueprintsPage() {
  const profile = await requireUserProfile();
  const tenants = await getAccessibleTenants(profile.id);
  const agencyIds = Array.from(new Set(tenants.map((t) => t.agencyId)));

  const blueprints = await prisma.blueprint.findMany({
    where: {
      OR: [
        { ownerType: "system" },
        ...(agencyIds.length ? [{ agencyId: { in: agencyIds } }] : []),
      ],
    },
    include: {
      _count: { select: { installs: true, items: true } },
    },
    orderBy: [{ ownerType: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blueprints"
        description="Reusable niche setups. Install one into a workspace to provision a pipeline, lead form, and follow-up workflow in one click."
      />

      {blueprints.length === 0 ? (
        <EmptyState
          title="No blueprints available"
          description="Run the seed script to load the system blueprints (med spa, roofer, dentist)."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blueprints.map((b) => (
            <Card key={b.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.name}</h3>
                    {b.niche && (
                      <p className="text-xs text-muted-foreground mt-0.5">{b.niche}</p>
                    )}
                  </div>
                  <Badge variant={b.ownerType === "system" ? "secondary" : "outline"}>
                    {b.ownerType}
                  </Badge>
                </div>
                {b.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {b.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  {b._count.items} item(s) · {b._count.installs} install(s)
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/app/blueprints/${b.id}`}>View blueprint</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
