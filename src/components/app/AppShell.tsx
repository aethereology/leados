"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import type { TenantOption } from "./TenantSwitcher";

export function AppShell({
  userEmail,
  tenants,
  showAdmin,
  children,
}: {
  userEmail: string;
  tenants: TenantOption[];
  showAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const tenantSlugMatch = pathname.match(/^\/app\/([^/]+)(\/|$)/);
  // exclude agency-level subroutes (/app/blueprints, /app/billing) from being
  // interpreted as a tenant slug
  const reserved = new Set(["blueprints", "billing"]);
  const currentTenantSlug =
    tenantSlugMatch && !reserved.has(tenantSlugMatch[1])
      ? tenantSlugMatch[1]
      : null;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        tenantSlug={currentTenantSlug}
        showAdmin={showAdmin}
        currentPath={pathname}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userEmail={userEmail}
          tenants={tenants}
          currentSlug={currentTenantSlug}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
