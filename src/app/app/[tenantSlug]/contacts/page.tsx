import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/app/EmptyState";
import { formatDate } from "@/lib/utils";

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: { tenantSlug: string };
  searchParams: { q?: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);
  const q = (searchParams.q ?? "").trim();

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId: tenant.id,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Every lead and customer in this workspace."
        actions={
          <Button asChild>
            <Link href={`/app/${tenant.slug}/contacts/new`}>New contact</Link>
          </Button>
        }
      />

      <form className="flex gap-2 max-w-md">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, or phone…"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Capture a lead from a form or add your first contact manually."
          action={
            <Button asChild>
              <Link href={`/app/${tenant.slug}/contacts/new`}>Add contact</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/${tenant.slug}/contacts/${c.id}`}
                      className="hover:underline"
                    >
                      {c.firstName ?? ""} {c.lastName ?? ""}
                      {!c.firstName && !c.lastName && (c.email ?? c.phone ?? "Unnamed")}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.source ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-right">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
