import { requireSuperAdmin, getAccessibleTenants } from "@/lib/access";
import { AppShell } from "@/components/app/AppShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireSuperAdmin();
  const tenants = await getAccessibleTenants(profile.id);
  return (
    <AppShell
      userEmail={profile.email}
      tenants={tenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
      showAdmin
    >
      {children}
    </AppShell>
  );
}
