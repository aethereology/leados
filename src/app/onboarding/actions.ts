"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserProfile } from "@/lib/access";
import { createAuditEvent } from "@/lib/audit";
import { agencyCreateSchema, tenantCreateSchema } from "@/lib/zod-schemas";
import { slugify } from "@/lib/utils";

const DEFAULT_STAGES = ["New Lead", "Contacted", "Booked", "Won", "Lost"];

export type OnboardingState = { error?: string };

export async function completeOnboardingAction(
  _prev: OnboardingState | undefined,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await requireUserProfile();

  const agencyParsed = agencyCreateSchema.safeParse({
    name: formData.get("agencyName"),
  });
  const tenantParsed = tenantCreateSchema.safeParse({
    name: formData.get("tenantName"),
  });
  if (!agencyParsed.success) return { error: "Agency name is required (2+ characters)." };
  if (!tenantParsed.success) return { error: "Client workspace name is required (2+ characters)." };

  const agencySlug = await uniqueAgencySlug(slugify(agencyParsed.data.name));

  const result = await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: {
        name: agencyParsed.data.name,
        slug: agencySlug,
      },
    });

    // Tenant slug uniqueness is scoped per-agency. Resolve inside the tx so a
    // racing call doesn't slip in between this lookup and the create.
    const tenantSlug = await uniqueTenantSlugInAgency(
      tx,
      agency.id,
      slugify(tenantParsed.data.name),
    );

    // owner membership for the agency
    await tx.membership.create({
      data: {
        userProfileId: profile.id,
        scope: "agency",
        agencyId: agency.id,
        role: "agency_owner",
      },
    });

    // first tenant
    const tenant = await tx.tenant.create({
      data: {
        agencyId: agency.id,
        name: tenantParsed.data.name,
        slug: tenantSlug,
        status: "active",
      },
    });

    // explicit tenant_admin membership so tenant-scoped checks succeed even
    // when agency membership isn't queried
    await tx.membership.create({
      data: {
        userProfileId: profile.id,
        scope: "tenant",
        tenantId: tenant.id,
        role: "tenant_admin",
      },
    });

    // default pipeline + stages
    const pipeline = await tx.pipeline.create({
      data: {
        tenantId: tenant.id,
        name: "Sales Pipeline",
        isDefault: true,
        stages: {
          create: DEFAULT_STAGES.map((name, i) => ({
            tenantId: tenant.id,
            name,
            position: i,
          })),
        },
      },
    });

    return { agency, tenant, pipeline };
  });

  await createAuditEvent({
    agencyId: result.agency.id,
    tenantId: result.tenant.id,
    userProfileId: profile.id,
    action: "onboarding.complete",
    targetType: "Tenant",
    targetId: result.tenant.id,
  });

  redirect(`/app/${result.tenant.slug}/dashboard`);
}

async function uniqueAgencySlug(base: string): Promise<string> {
  if (!base) base = "agency";
  let slug = base;
  let n = 1;
  // very small race here is acceptable; DB uniqueness will catch real collisions
  while (await prisma.agency.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

type TenantTxClient = {
  tenant: {
    findUnique: (args: {
      where: { agencyId_slug: { agencyId: string; slug: string } };
    }) => Promise<{ id: string } | null>;
  };
};

async function uniqueTenantSlugInAgency(
  tx: TenantTxClient,
  agencyId: string,
  base: string,
): Promise<string> {
  if (!base) base = "workspace";
  let slug = base;
  let n = 1;
  while (
    await tx.tenant.findUnique({ where: { agencyId_slug: { agencyId, slug } } })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
