/**
 * One-shot cleanup for the Phase 2 smoke-test bugs.
 *
 * Does two things, atomically:
 *   1. Deletes the duplicate `brightskin-med-spa` tenant (and all its data via
 *      cascade) so the surviving tenant is reachable by slug.
 *   2. Inserts a Twilio ProviderAccount for the surviving tenant so the inbound
 *      SMS webhook can reverse-map +18335057105 → tenantId.
 *
 * Default mode is a dry-run that prints what would change. Pass `--apply` to
 * actually mutate the database.
 *
 *   npx tsx scripts/fix-phase2-state.ts          # dry-run
 *   npx tsx scripts/fix-phase2-state.ts --apply  # do it
 */
import { prisma } from "../src/lib/prisma";

const KEEP_TENANT_ID = "cmpfo8q1a000e137z4v9vdico"; // brightskin-med-spa under spark-growth-systems (5 contacts, 9 opps, etc.)
const DELETE_TENANT_ID = "cmpgzr2fq000jdl8w7dpo8kax"; // duplicate brightskin-med-spa under spark-growth-systems-2
const TWILIO_FROM_NUMBER = "+18335057105";

async function main() {
  const apply = process.argv.includes("--apply");

  console.log(`Mode: ${apply ? "APPLY (will mutate)" : "DRY-RUN (no writes)"}`);
  console.log();

  // 1. Verify the survivor exists and has the data we expect
  const keep = await prisma.tenant.findUnique({
    where: { id: KEEP_TENANT_ID },
    include: { agency: { select: { slug: true } } },
  });
  if (!keep) throw new Error(`Survivor tenant ${KEEP_TENANT_ID} not found`);
  const [keepContacts, keepOpps, keepSubs] = await Promise.all([
    prisma.contact.count({ where: { tenantId: KEEP_TENANT_ID } }),
    prisma.opportunity.count({ where: { tenantId: KEEP_TENANT_ID } }),
    prisma.formSubmission.count({ where: { tenantId: KEEP_TENANT_ID } }),
  ]);
  console.log(`KEEP    tenant=${keep.slug} (id=${keep.id}, agency=${keep.agency.slug})`);
  console.log(`        contacts=${keepContacts}  opportunities=${keepOpps}  submissions=${keepSubs}`);
  console.log();

  // 2. Show the duplicate that will be deleted (with full cascade preview)
  const del = await prisma.tenant.findUnique({
    where: { id: DELETE_TENANT_ID },
    include: { agency: { select: { slug: true } } },
  });
  if (!del) {
    console.log(`DELETE  tenant ${DELETE_TENANT_ID} already gone — nothing to do.`);
  } else {
    const [
      delContacts,
      delOpps,
      delSubs,
      delForms,
      delPipelines,
      delWorkflows,
      delConvs,
      delMessages,
      delAudits,
      delMembers,
      delProvAcct,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.opportunity.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.formSubmission.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.form.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.pipeline.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.workflowDefinition.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.conversation.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.message.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.auditEvent.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.membership.count({ where: { tenantId: DELETE_TENANT_ID } }),
      prisma.providerAccount.count({ where: { tenantId: DELETE_TENANT_ID } }),
    ]);
    console.log(`DELETE  tenant=${del.slug} (id=${del.id}, agency=${del.agency.slug})`);
    console.log(`        contacts=${delContacts}  opportunities=${delOpps}  submissions=${delSubs}  forms=${delForms}`);
    console.log(`        pipelines=${delPipelines}  workflows=${delWorkflows}  conversations=${delConvs}  messages=${delMessages}`);
    console.log(`        audits=${delAudits}  memberships=${delMembers}  providerAccounts=${delProvAcct}`);
    console.log(`        → these all cascade away when the tenant is deleted.`);
  }
  console.log();

  // 3. Show the ProviderAccount that will be upserted onto the survivor
  const existingPa = await prisma.providerAccount.findUnique({
    where: { tenantId_provider: { tenantId: KEEP_TENANT_ID, provider: "twilio" } },
  });
  if (existingPa) {
    console.log(`UPSERT  ProviderAccount(tenantId=${KEEP_TENANT_ID}, provider=twilio) already exists.`);
    console.log(`        existing config: ${JSON.stringify(existingPa.configJson)}`);
    console.log(`        will be UPDATED to: { fromNumber: "${TWILIO_FROM_NUMBER}" }, isActive=true`);
  } else {
    console.log(`UPSERT  ProviderAccount(tenantId=${KEEP_TENANT_ID}, provider=twilio) does not exist.`);
    console.log(`        will be CREATED with: { fromNumber: "${TWILIO_FROM_NUMBER}" }, isActive=true`);
  }
  console.log();

  if (!apply) {
    console.log("Dry-run only — no writes performed. Re-run with --apply to commit.");
    return;
  }

  // 4. Do it atomically
  console.log("Applying changes…");
  await prisma.$transaction(async (tx) => {
    if (del) {
      await tx.tenant.delete({ where: { id: DELETE_TENANT_ID } });
      console.log(`  deleted tenant ${DELETE_TENANT_ID}`);
    }
    await tx.providerAccount.upsert({
      where: { tenantId_provider: { tenantId: KEEP_TENANT_ID, provider: "twilio" } },
      create: {
        tenantId: KEEP_TENANT_ID,
        provider: "twilio",
        isActive: true,
        configJson: { fromNumber: TWILIO_FROM_NUMBER },
      },
      update: {
        isActive: true,
        configJson: { fromNumber: TWILIO_FROM_NUMBER },
      },
    });
    console.log(`  upserted ProviderAccount(twilio) on tenant ${KEEP_TENANT_ID}`);
  });
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
