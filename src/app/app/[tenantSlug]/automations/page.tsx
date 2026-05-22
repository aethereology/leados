import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { formatDate } from "@/lib/utils";
import { toggleWorkflowAction } from "./actions";

export default async function AutomationsPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);

  const [workflows, recentRuns] = await Promise.all([
    prisma.workflowDefinition.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { runs: true } } },
    }),
    prisma.workflowRun.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { workflow: { select: { name: true } } },
    }),
  ]);

  async function toggle(formData: FormData) {
    "use server";
    await toggleWorkflowAction(params.tenantSlug, formData);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Automations"
        description="Workflow actions run when their trigger fires. SMS and email require provider credentials and contact consent."
        actions={
          <Button asChild>
            <Link href={`/app/${tenant.slug}/automations/new`}>New workflow</Link>
          </Button>
        }
      />

      {workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          description="Create a workflow definition that runs when a form is submitted or an opportunity changes stage."
          action={
            <Button asChild>
              <Link href={`/app/${tenant.slug}/automations/new`}>Create your first workflow</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {workflows.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Trigger: <code>{w.triggerType}</code> · {w._count.runs} run(s) ·{" "}
                    {formatDate(w.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={w.isActive ? "success" : "secondary"}>
                    {w.isActive ? "active" : "inactive"}
                  </Badge>
                  <form action={toggle}>
                    <input type="hidden" name="id" value={w.id} />
                    <Button type="submit" variant="outline" size="sm">
                      {w.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent workflow runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs yet. Submit a form or move an opportunity between stages to trigger a workflow.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {recentRuns.map((r) => (
                <li key={r.id} className="py-2 flex justify-between">
                  <span className="font-medium">{r.workflow.name}</span>
                  <span className="flex items-center gap-3">
                    <Badge
                      variant={r.status === "success" ? "success" : r.status === "failed" ? "destructive" : "secondary"}
                    >
                      {r.status}
                    </Badge>
                    <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
