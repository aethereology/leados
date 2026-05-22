import Link from "next/link";
import { requireSuperAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  await requireSuperAdmin();

  const [agencies, tenants, users, contacts, workflowRuns, recentAgencies] = await Promise.all([
    prisma.agency.count(),
    prisma.tenant.count(),
    prisma.userProfile.count(),
    prisma.contact.count(),
    prisma.workflowRun.count(),
    prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { tenants: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Super admin"
        description="System-wide view across every agency and tenant."
        actions={
          <Button asChild variant="outline">
            <Link href="/app">Back to app</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Agencies" value={agencies} />
        <StatCard label="Tenants" value={tenants} />
        <StatCard label="Users" value={users} />
        <StatCard label="Contacts" value={contacts} />
        <StatCard label="Workflow runs" value={workflowRuns} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent agencies</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAgencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agencies yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recentAgencies.map((a) => (
                <li key={a.id} className="py-2 flex justify-between">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">
                    {a._count.tenants} workspace(s)
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
