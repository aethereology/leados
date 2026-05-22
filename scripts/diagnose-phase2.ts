/**
 * Diagnostic for the Phase 2 smoke-test bugs.
 *
 * Reads (does not mutate) and prints:
 *   - all tenants + their slugs
 *   - all forms + which tenant they belong to
 *   - contact counts and the 5 most recent contacts per tenant
 *   - opportunity counts and the 5 most recent opportunities per tenant
 *   - form submission counts and the 5 most recent submissions
 *   - workflow run counts and the 5 most recent runs (with action outcomes)
 *   - whether any ProviderAccount(twilio) rows exist
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: { agency: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== TENANTS ===");
  for (const t of tenants) {
    console.log(`- ${t.slug.padEnd(28)} id=${t.id}  agency=${t.agency.slug}`);
  }

  const forms = await prisma.form.findMany({
    include: { tenant: { select: { slug: true } } },
  });
  console.log("\n=== FORMS ===");
  for (const f of forms) {
    console.log(
      `- slug=${f.slug.padEnd(48)} tenant=${f.tenant.slug.padEnd(28)} active=${f.isActive}  id=${f.id}`,
    );
  }

  for (const t of tenants) {
    const [contactCount, recentContacts, oppCount, recentOpps, subCount, recentSubs, runCount, recentRuns] =
      await Promise.all([
        prisma.contact.count({ where: { tenantId: t.id } }),
        prisma.contact.findMany({
          where: { tenantId: t.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true, source: true },
        }),
        prisma.opportunity.count({ where: { tenantId: t.id } }),
        prisma.opportunity.findMany({
          where: { tenantId: t.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { stage: { select: { name: true } }, pipeline: { select: { name: true, isDefault: true } } },
        }),
        prisma.formSubmission.count({ where: { tenantId: t.id } }),
        prisma.formSubmission.findMany({
          where: { tenantId: t.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { form: { select: { slug: true } }, contact: { select: { firstName: true, email: true, phone: true } } },
        }),
        prisma.workflowRun.count({ where: { tenantId: t.id } }),
        prisma.workflowRun.findMany({
          where: { tenantId: t.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, triggerType: true, status: true, createdAt: true, resultJson: true, workflowId: true },
        }),
      ]);

    console.log(`\n=== TENANT: ${t.slug} (${t.id}) ===`);
    console.log(`Contacts: ${contactCount}`);
    for (const c of recentContacts) {
      console.log(
        `  - ${c.createdAt.toISOString()}  ${(c.firstName ?? "") + " " + (c.lastName ?? "")}  email=${c.email ?? "—"}  phone=${c.phone ?? "—"}  source=${c.source ?? "—"}`,
      );
    }
    console.log(`Opportunities: ${oppCount}`);
    for (const o of recentOpps) {
      console.log(
        `  - ${o.createdAt.toISOString()}  title="${o.title}"  pipeline=${o.pipeline.name}(default=${o.pipeline.isDefault})  stage=${o.stage.name}  status=${o.status}`,
      );
    }
    console.log(`Form submissions: ${subCount}`);
    for (const s of recentSubs) {
      console.log(
        `  - ${s.createdAt.toISOString()}  form=${s.form.slug}  contact=${s.contact?.firstName ?? "—"}/${s.contact?.email ?? "—"}/${s.contact?.phone ?? "—"}`,
      );
    }
    console.log(`Workflow runs: ${runCount}`);
    for (const r of recentRuns) {
      console.log(`  - ${r.createdAt.toISOString()}  trigger=${r.triggerType}  status=${r.status}`);
      const result = r.resultJson as { actions?: Array<{ type: string; status: string; detail?: string; messageId?: string }> } | null;
      for (const a of result?.actions ?? []) {
        console.log(`      · ${a.type}: ${a.status}${a.detail ? ` — ${a.detail}` : ""}${a.messageId ? ` (msg=${a.messageId})` : ""}`);
      }
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { tenantId: t.id },
      include: { stages: { orderBy: { position: "asc" } } },
    });
    console.log(`Pipelines: ${pipelines.length}`);
    for (const p of pipelines) {
      console.log(`  - ${p.name}  default=${p.isDefault}  stages=${p.stages.map((s) => s.name).join(", ")}`);
    }
  }

  const twilioAccounts = await prisma.providerAccount.findMany({
    where: { provider: "twilio" },
    include: { tenant: { select: { slug: true } } },
  });
  console.log("\n=== PROVIDER ACCOUNTS (twilio) ===");
  if (twilioAccounts.length === 0) {
    console.log("(none — inbound SMS webhook cannot route replies)");
  } else {
    for (const pa of twilioAccounts) {
      console.log(`- tenant=${pa.tenant.slug}  active=${pa.isActive}  config=${JSON.stringify(pa.configJson)}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
