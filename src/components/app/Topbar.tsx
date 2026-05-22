import Link from "next/link";
import { TenantSwitcher, type TenantOption } from "./TenantSwitcher";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

export function Topbar({
  userEmail,
  tenants,
  currentSlug,
}: {
  userEmail: string;
  tenants: TenantOption[];
  currentSlug: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        {tenants.length > 0 && (
          <TenantSwitcher tenants={tenants} currentSlug={currentSlug} />
        )}
        {tenants.length === 0 && (
          <Link
            href="/onboarding"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Finish setup
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-sm text-muted-foreground">
          {userEmail}
        </span>
        <form action={signOutAction}>
          <Button size="sm" variant="outline" type="submit">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
