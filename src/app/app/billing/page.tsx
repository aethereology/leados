import { requireUserProfile } from "@/lib/access";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  { name: "Starter", price: "$297/mo", body: "Solo agency, one client workspace." },
  { name: "Growth", price: "$497/mo", body: "Up to 10 workspaces and full automation." },
  { name: "Agency", price: "$997/mo", body: "Unlimited workspaces and white-label." },
];

export default async function BillingPage() {
  await requireUserProfile();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Pricing and subscription management for your agency. Stripe integration lands in Phase 4."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name}>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <Badge variant="secondary">{p.price}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
