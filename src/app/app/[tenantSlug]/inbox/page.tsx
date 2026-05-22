import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function InboxPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);

  const conversations = await prisma.conversation.findMany({
    where: { tenantId: tenant.id },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Unified conversations across SMS and email."
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Once a contact replies to a workflow message or you send one from a contact's detail page, the thread shows up here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {conversations.map((conv) => {
                const lastMessage = conv.messages[0];
                const contactName =
                  [conv.contact.firstName, conv.contact.lastName].filter(Boolean).join(" ") ||
                  conv.contact.email ||
                  conv.contact.phone ||
                  "Unnamed contact";
                return (
                  <li key={conv.id}>
                    <Link
                      href={`/app/${tenant.slug}/contacts/${conv.contact.id}`}
                      className="flex items-start justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{contactName}</span>
                          <Badge variant="secondary" className="uppercase">{conv.channel}</Badge>
                          {lastMessage && (
                            <Badge variant="outline" className="uppercase text-xs">
                              {lastMessage.direction === "outbound" ? "sent" : "received"}
                            </Badge>
                          )}
                        </div>
                        {lastMessage ? (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {lastMessage.subject ? (
                              <span className="font-medium text-foreground">
                                {lastMessage.subject}{" — "}
                              </span>
                            ) : null}
                            {lastMessage.body}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">No messages yet.</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                        {formatDate(conv.lastMessageAt ?? conv.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
