import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminEmails } from "@/lib/env";
import type { Membership, Role, Tenant, UserProfile } from "@prisma/client";

/**
 * Tenant access utilities.
 *
 * IMPORTANT: every tenant-scoped database query MUST go through one of these.
 * Never query Contact/Opportunity/Form/etc with a raw tenantId from a route
 * param — always resolve the tenant via requireTenantAccess() first.
 *
 * TODO: once Supabase RLS policies are in place, these utilities should still
 * run because RLS in Phase 1 is not enforced.
 */

export type TenantWithAgency = Tenant & {
  agency: {
    id: string;
    name: string;
    slug: string;
  };
};

export async function getAuthUser() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Returns the UserProfile row for the currently-signed-in Supabase user,
 * creating one on first call if it doesn't exist yet (just-in-time mirror).
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const existing = await prisma.userProfile.findUnique({
    where: { authUserId: authUser.id },
  });
  if (existing) return existing;

  // First time seeing this Supabase user — mirror them into our DB.
  if (!authUser.email) return null;
  return prisma.userProfile.upsert({
    where: { email: authUser.email },
    create: {
      authUserId: authUser.id,
      email: authUser.email,
      name:
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email.split("@")[0],
    },
    update: { authUserId: authUser.id },
  });
}

export async function requireUserProfile(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

/**
 * Returns all tenants the user can access (via agency membership OR direct
 * tenant membership). Used for the tenant switcher and /app fan-out.
 */
export async function getAccessibleTenants(
  userProfileId: string,
): Promise<TenantWithAgency[]> {
  const memberships = await prisma.membership.findMany({
    where: { userProfileId },
  });

  const agencyIds = memberships
    .filter((m) => m.scope === "agency" && m.agencyId)
    .map((m) => m.agencyId!) as string[];

  const tenantIds = memberships
    .filter((m) => m.scope === "tenant" && m.tenantId)
    .map((m) => m.tenantId!) as string[];

  if (agencyIds.length === 0 && tenantIds.length === 0) return [];

  return prisma.tenant.findMany({
    where: {
      OR: [
        agencyIds.length ? { agencyId: { in: agencyIds } } : undefined,
        tenantIds.length ? { id: { in: tenantIds } } : undefined,
      ].filter(Boolean) as object[],
    },
    include: {
      agency: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Resolves a tenant by slug AND verifies the current user has access.
 * Redirects to /login if not signed in, or /app if user has no access.
 */
export async function requireTenantAccess(
  tenantSlug: string,
): Promise<{ profile: UserProfile; tenant: TenantWithAgency; membership: Membership | null }> {
  const profile = await requireUserProfile();
  const tenants = await getAccessibleTenants(profile.id);
  const tenant = tenants.find((t) => t.slug === tenantSlug);
  if (!tenant) {
    redirect("/app");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userProfileId: profile.id,
      OR: [{ tenantId: tenant.id }, { agencyId: tenant.agencyId }],
    },
  });

  return { profile, tenant, membership };
}

export async function requireAgencyAccess(
  agencyId: string,
): Promise<{ profile: UserProfile; membership: Membership }> {
  const profile = await requireUserProfile();
  const membership = await prisma.membership.findFirst({
    where: { userProfileId: profile.id, agencyId },
  });
  if (!membership) {
    redirect("/app");
  }
  return { profile, membership };
}

export function isSuperAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const admins = getAdminEmails();
  return admins.includes(profile.email.toLowerCase());
}

export async function requireSuperAdmin(): Promise<UserProfile> {
  const profile = await requireUserProfile();
  if (!isSuperAdmin(profile)) {
    redirect("/app");
  }
  return profile;
}

export const TENANT_WRITE_ROLES: Role[] = [
  "super_admin",
  "agency_owner",
  "agency_admin",
  "tenant_admin",
  "agent",
];

export const AGENCY_ADMIN_ROLES: Role[] = [
  "super_admin",
  "agency_owner",
  "agency_admin",
];

export function canWriteTenant(membership: Membership | null): boolean {
  if (!membership) return false;
  return TENANT_WRITE_ROLES.includes(membership.role);
}

export function canManageAgency(membership: Membership | null): boolean {
  if (!membership) return false;
  return AGENCY_ADMIN_ROLES.includes(membership.role);
}
