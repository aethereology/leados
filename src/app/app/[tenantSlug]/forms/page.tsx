import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function FormsListPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);
  const forms = await prisma.form.findMany({
    where: { tenantId: tenant.id },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        description="Lead capture forms — share the public URL to start capturing submissions."
        actions={
          <Button asChild>
            <Link href={`/app/${tenant.slug}/forms/new`}>New form</Link>
          </Button>
        }
      />

      {forms.length === 0 ? (
        <EmptyState
          title="No forms yet"
          description="Create a lead capture form and share its public URL with prospects."
          action={
            <Button asChild>
              <Link href={`/app/${tenant.slug}/forms/new`}>Create your first form</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Public URL</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    <Link href={`/app/${tenant.slug}/forms/${f.id}`} className="hover:underline">
                      {f.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <code className="text-xs">/forms/{f.slug}</code>
                  </TableCell>
                  <TableCell>{f._count.submissions}</TableCell>
                  <TableCell>
                    <Badge variant={f.isActive ? "success" : "secondary"}>
                      {f.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">{formatDate(f.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
