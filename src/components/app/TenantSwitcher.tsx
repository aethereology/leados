"use client";

import { useRouter, usePathname } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";

export type TenantOption = { id: string; name: string; slug: string };

export function TenantSwitcher({
  tenants,
  currentSlug,
}: {
  tenants: TenantOption[];
  currentSlug: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const current = tenants.find((t) => t.slug === currentSlug);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    if (!slug) return;
    // Try to preserve the current section (dashboard, contacts, etc.)
    const match = pathname?.match(/^\/app\/[^/]+(\/.*)?$/);
    const rest = match?.[1] ?? "/dashboard";
    router.push(`/app/${slug}${rest}`);
  }

  return (
    <div className="relative inline-flex items-center">
      <ChevronsUpDown className="absolute right-2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <select
        value={current?.slug ?? ""}
        onChange={handleChange}
        className="appearance-none h-9 pr-8 pl-3 rounded-md border bg-background text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Switch workspace"
      >
        {!current && <option value="">Pick a workspace…</option>}
        {tenants.map((t) => (
          <option key={t.id} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
      {current && (
        <Check className="ml-2 h-4 w-4 text-muted-foreground hidden lg:inline" />
      )}
    </div>
  );
}
