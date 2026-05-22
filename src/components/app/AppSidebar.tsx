import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  Inbox,
  Calendar,
  Workflow,
  Settings,
  Boxes,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; Icon: typeof LayoutDashboard };

export function AppSidebar({
  tenantSlug,
  showAdmin = false,
  currentPath,
}: {
  tenantSlug: string | null;
  showAdmin?: boolean;
  currentPath?: string;
}) {
  const tenantItems: Item[] = tenantSlug
    ? [
        { href: `/app/${tenantSlug}/dashboard`, label: "Dashboard", Icon: LayoutDashboard },
        { href: `/app/${tenantSlug}/contacts`, label: "Contacts", Icon: Users },
        { href: `/app/${tenantSlug}/pipeline`, label: "Pipeline", Icon: Kanban },
        { href: `/app/${tenantSlug}/forms`, label: "Forms", Icon: FileText },
        { href: `/app/${tenantSlug}/inbox`, label: "Inbox", Icon: Inbox },
        { href: `/app/${tenantSlug}/calendar`, label: "Calendar", Icon: Calendar },
        { href: `/app/${tenantSlug}/automations`, label: "Automations", Icon: Workflow },
        { href: `/app/${tenantSlug}/settings`, label: "Settings", Icon: Settings },
      ]
    : [];

  const agencyItems: Item[] = [
    { href: "/app/blueprints", label: "Blueprints", Icon: Boxes },
    { href: "/app/billing", label: "Billing", Icon: CreditCard },
  ];

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-background h-screen sticky top-0">
      <div className="px-5 py-5 border-b">
        <Link href="/app" className="flex items-center gap-2 font-semibold">
          <span className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">
            LO
          </span>
          <span className="tracking-tight">LeadOS</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {tenantSlug && (
          <div>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Workspace
            </div>
            <ul className="space-y-0.5">
              {tenantItems.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent",
                      currentPath === href && "bg-accent font-medium",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Agency
          </div>
          <ul className="space-y-0.5">
            {agencyItems.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent",
                    currentPath === href && "bg-accent font-medium",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {showAdmin && (
          <div>
            <div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Admin
            </div>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent",
                    currentPath === "/admin" && "bg-accent font-medium",
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        Phase 1 · MVP
      </div>
    </aside>
  );
}
