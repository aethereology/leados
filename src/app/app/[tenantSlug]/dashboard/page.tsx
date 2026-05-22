import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);

  const [
    contactsCount,
    opportunitiesCount,
    openOpportunitiesCount,
    formsCount,
    submissionsCount,
    workflowRunsCount,
    recentContacts,
    recentOpportunities,
    recentSubmissions,
  ] = await Promise.all([
    prisma.contact.count({ where: { tenantId: tenant.id } }),
    prisma.opportunity.count({ where: { tenantId: tenant.id } }),
    prisma.opportunity.count({ where: { tenantId: tenant.id, status: "open" } }),
    prisma.form.count({ where: { tenantId: tenant.id } }),
    prisma.formSubmission.count({ where: { tenantId: tenant.id } }),
    prisma.workflowRun.count({ where: { tenantId: tenant.id } }),
    prisma.contact.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.opportunity.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { stage: true, contact: true },
    }),
    prisma.formSubmission.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { form: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${tenant.name} dashboard`}
        description={`Workspace overview · ${tenant.agency.name}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/app/${tenant.slug}/contacts/new`}>Add contact</Link>
            </Button>
            <Button asChild>
              <Link href={`/app/${tenant.slug}/forms/new`}>New form</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contacts" value={contactsCount} hint="Leads & customers" />
        <StatCard label="Open opportunities" value={openOpportunitiesCount} hint={`${opportunitiesCount} total`} />
        <StatCard label="Forms" value={formsCount} hint={`${submissionsCount} submissions`} />
        <StatCard label="Workflow runs" value={workflowRunsCount} hint="Triggered automations" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contacts yet. Add your first contact or publish a form.
              </p>
            ) : (
              <ul className="divide-y">
                {recentContacts.map((c) => (
                  <li key={c.id} className="py-2 flex justify-between text-sm">
                    <Link
                      href={`/app/${tenant.slug}/contacts/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.firstName ?? ""} {c.lastName ?? ""} {!c.firstName && !c.lastName && (c.email ?? c.phone ?? "Unnamed")}
                    </Link>
                    <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOpportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No opportunities yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentOpportunities.map((o) => (
                  <li key={o.id} className="py-2 flex justify-between text-sm">
                    <span className="font-medium">{o.title}</span>
                    <Badge variant="secondary">{o.stage.name}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent form submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No submissions yet. Share a form's public URL to start capturing leads.
              </p>
            ) : (
              <ul className="divide-y">
                {recentSubmissions.map((s) => (
                  <li key={s.id} className="py-2 flex justify-between text-sm">
                    <span>
                      <span className="font-medium">{s.form.name}</span>
                      <span className="text-muted-foreground"> · {formatDate(s.createdAt)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {(s.payloadJson as Record<string, unknown>)?.email as string ??
                        (s.payloadJson as Record<string, unknown>)?.phone as string ??
                        "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
