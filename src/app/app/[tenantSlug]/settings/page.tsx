import { requireTenantAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTwilioProviderAction } from "./actions";

export default async function SettingsPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { tenant } = await requireTenantAccess(params.tenantSlug);
  const twilioAccount = await prisma.providerAccount.findUnique({
    where: {
      tenantId_provider: {
        tenantId: tenant.id,
        provider: "twilio",
      },
    },
  });
  const twilioConfig = twilioAccount?.configJson as { fromNumber?: string } | undefined;
  const updateTwilioAction = updateTwilioProviderAction.bind(null, params.tenantSlug);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace settings and branding (placeholders for Phase 1)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slug</span>
            <code className="text-xs">{tenant.slug}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agency</span>
            <span>{tenant.agency.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={tenant.status === "active" ? "success" : "secondary"}>{tenant.status}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Branding (logo, accent color, white-label domain) is part of Phase 5.
          The Tenant and Agency models already include <code>brandingJson</code> so
          settings can be persisted now.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Messaging</CardTitle>
            <Badge variant={twilioAccount?.isActive ? "success" : "secondary"}>
              {twilioAccount?.isActive ? "Twilio number set" : "Not configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form action={updateTwilioAction} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="twilioFromNumber">Twilio phone number</Label>
              <Input
                id="twilioFromNumber"
                name="twilioFromNumber"
                type="tel"
                defaultValue={twilioConfig?.fromNumber ?? ""}
                placeholder="+15551234567"
              />
              <p className="text-xs text-muted-foreground">
                Used for outbound SMS and inbound webhook tenant routing. Leave blank to disable
                this tenant's Twilio routing.
              </p>
            </div>
            <Button type="submit">Save messaging settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
