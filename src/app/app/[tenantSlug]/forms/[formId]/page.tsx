import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormBuilderSimple } from "@/components/forms/FormBuilderSimple";
import { updateFormAction } from "../actions";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export default async function FormDetailPage({
  params,
}: {
  params: { tenantSlug: string; formId: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);
  const form = await prisma.form.findFirst({
    where: { id: params.formId, tenantId: tenant.id },
    include: {
      submissions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!form) notFound();

  const action = updateFormAction.bind(null, params.tenantSlug, form.id);
  const publicUrl = `${env.NEXT_PUBLIC_APP_URL}/forms/${form.slug}`;
  const rawSchema = form.schemaJson as {
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "email" | "tel" | "textarea" | "select";
      required?: boolean;
    }>;
  };
  // FormBuilderSimple expects `required: boolean` (not optional). Normalize here.
  const fields = (rawSchema.fields ?? []).map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    required: !!f.required,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={form.name}
        description={`Public form · ${form.submissions.length} recent submission(s)`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/app/${tenant.slug}/forms`}>Back to forms</Link>
            </Button>
            <Button asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">Open public form</a>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Share</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">Public URL</div>
            <code className="block text-xs bg-muted rounded-md p-2">{publicUrl}</code>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">Embed placeholder</div>
            <code className="block text-xs bg-muted rounded-md p-2 whitespace-pre">
              {`<iframe src="${publicUrl}" width="100%" height="600" style="border:0"></iframe>`}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit form</CardTitle>
        </CardHeader>
        <CardContent>
          <FormBuilderSimple
            action={action}
            initial={{
              name: form.name,
              isActive: form.isActive,
              fields,
            }}
            submitLabel="Save form"
            showActiveToggle
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {form.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No submissions yet. Share the public URL to start capturing leads.
            </p>
          ) : (
            <ul className="space-y-2">
              {form.submissions.map((s) => {
                const payload = s.payloadJson as Record<string, string>;
                return (
                  <li key={s.id} className="text-sm border rounded-md p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {payload.firstName ?? ""} {payload.lastName ?? ""}
                        {!payload.firstName && !payload.lastName && (payload.email ?? payload.phone ?? "Anonymous")}
                      </span>
                      <span className="text-muted-foreground">{formatDate(s.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      {Object.entries(payload).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-medium">{k}:</span> {String(v)}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
