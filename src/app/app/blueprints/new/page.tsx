import Link from "next/link";
import { requireUserProfile } from "@/lib/access";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewBlueprintPage() {
  await requireUserProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New blueprint"
        description="Author your own niche setup."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/blueprints">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
          <p>
            Custom blueprint authoring is intentionally a placeholder in Phase 1.
            Use the seeded system blueprints (med spa, roofer, dentist) to get
            started, or extend the seed script to add your own.
          </p>
          <p>
            Phase 2+ will add a real blueprint builder UI for agency-owned
            blueprints, including pipeline/form/workflow templates and a
            marketplace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
