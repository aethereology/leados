import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { ContactForm } from "@/components/contacts/ContactForm";
import { MessageComposer } from "@/components/contacts/MessageComposer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  updateContactAction,
  deleteContactAction,
  sendContactMessageAction,
} from "../actions";

export default async function ContactDetailPage({
  params,
}: {
  params: { tenantSlug: string; contactId: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);
  const contact = await prisma.contact.findFirst({
    where: { id: params.contactId, tenantId: tenant.id },
    include: {
      opportunities: { include: { stage: true }, orderBy: { createdAt: "desc" } },
      formSubmissions: { include: { form: true }, orderBy: { createdAt: "desc" }, take: 10 },
      conversations: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 20 },
        },
        orderBy: { lastMessageAt: "desc" },
      },
    },
  });
  if (!contact) notFound();

  const updateAction = updateContactAction.bind(null, params.tenantSlug, contact.id);
  const messageAction = sendContactMessageAction.bind(null, params.tenantSlug, contact.id);
  const canSms = !!(contact.phone && contact.consentSms);
  const canEmail = !!(contact.email && contact.consentEmail);

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
          contact.email ||
          contact.phone ||
          "Unnamed contact"
        }
        description={`Added ${formatDate(contact.createdAt)} · Source: ${contact.source ?? "—"}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/app/${tenant.slug}/contacts`}>Back to contacts</Link>
            </Button>
            <form action={async () => {
              "use server";
              await deleteContactAction(params.tenantSlug, contact.id);
            }}>
              <Button type="submit" variant="destructive">Delete</Button>
            </form>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageComposer action={messageAction} canSms={canSms} canEmail={canEmail} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <div className="space-y-6">
                  {contact.conversations.map((conv) => (
                    <div key={conv.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium uppercase tracking-wide">{conv.channel}</span>
                        {conv.lastMessageAt && (
                          <span>Last activity {formatDate(conv.lastMessageAt)}</span>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {conv.messages.map((m) => (
                          <li
                            key={m.id}
                            className={`rounded-md border p-3 text-sm ${
                              m.direction === "outbound" ? "bg-muted/40" : "bg-background"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {m.direction === "outbound" ? "You" : "Contact"} ·{" "}
                                <span className="uppercase">{m.status}</span>
                              </span>
                              <span>{formatDate(m.createdAt)}</span>
                            </div>
                            {m.subject && (
                              <p className="mt-1 font-medium">{m.subject}</p>
                            )}
                            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                            {m.errorMessage && (
                              <p className="mt-1 text-xs text-destructive">{m.errorMessage}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm
                initial={{
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                  email: contact.email,
                  phone: contact.phone,
                  source: contact.source,
                  tags: contact.tags,
                  notes: contact.notes,
                  consentSms: contact.consentSms,
                  consentEmail: contact.consentEmail,
                }}
                action={updateAction}
                submitLabel="Save changes"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No opportunities for this contact yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {contact.opportunities.map((o) => (
                    <li key={o.id} className="flex justify-between border rounded-md p-2">
                      <span className="font-medium">{o.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{o.stage.name}</Badge>
                        <span className="text-muted-foreground">{formatCurrency(o.value?.toString())}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.formSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No form submissions yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {contact.formSubmissions.map((s) => (
                    <li key={s.id} className="border rounded-md p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{s.form.name}</span>
                        <span className="text-muted-foreground">{formatDate(s.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
