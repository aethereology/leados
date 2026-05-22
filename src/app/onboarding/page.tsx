import { redirect } from "next/navigation";
import { requireUserProfile, getAccessibleTenants } from "@/lib/access";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const profile = await requireUserProfile();
  const tenants = await getAccessibleTenants(profile.id);
  if (tenants.length > 0) {
    redirect(`/app/${tenants[0].slug}/dashboard`);
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set up your agency
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your agency and your first client workspace. You can add more
            workspaces and install blueprints anytime.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
