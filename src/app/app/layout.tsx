import { requireUserProfile, getAccessibleTenants, isSuperAdmin } from "@/lib/access";
import { AppShell } from "@/components/app/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUserProfile();
  const tenants = await getAccessibleTenants(profile.id);
  const superAdmin = isSuperAdmin(profile);

  return (
    <AppShell
      userEmail={profile.email}
      tenants={tenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
      showAdmin={superAdmin}
    >
      {children}
    </AppShell>
  );
}
