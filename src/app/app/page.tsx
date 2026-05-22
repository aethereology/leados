import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserProfile, getAccessibleTenants } from "@/lib/access";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";

export default async function AppHome() {
  const profile = await requireUserProfile();
  const tenants = await getAccessibleTenants(profile.id);

  if (tenants.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Welcome to LeadOS"
          description="You don't have any client workspaces yet. Set up your agency to get started."
        />
        <EmptyState
          title="No workspaces yet"
          description="Create your agency and your first client workspace to start capturing leads."
          action={
            <Button asChild>
              <Link href="/onboarding">Start onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Single workspace? Drop the user straight into it.
  redirect(`/app/${tenants[0].slug}/dashboard`);
}
