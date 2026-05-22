/**
 * LeadOS seed script
 *
 * Idempotent where practical — safe to rerun. Creates:
 *   - 3 system blueprints (med spa, roofer, dentist)
 *   - 1 demo agency (Spark Growth Systems)
 *   - 1 demo tenant (BrightSkin Med Spa) with default pipeline, contacts,
 *     opportunities, a form, and a workflow definition
 *
 * Re-running this script will not create duplicates of system blueprints,
 * the demo agency, or the demo tenant. Per-row data (contacts/opps) will
 * NOT be re-added if the demo tenant already exists.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_BLUEPRINTS = [
  {
    slug: "system-med-spa-lead-followup",
    name: "Med Spa Lead Follow-Up Blueprint",
    niche: "Med Spa",
    description: "Consultation request form, niche pipeline, and follow-up workflow for med spas.",
    items: {
      pipeline: {
        name: "Med Spa Pipeline",
        isDefault: true,
        stages: [
          { name: "New Consultation Lead", position: 0 },
          { name: "Contacted", position: 1 },
          { name: "Consultation Booked", position: 2 },
          { name: "Treatment Sold", position: 3 },
          { name: "Lost", position: 4 },
        ],
      },
      form: {
        name: "Consultation Request Form",
        slug: "consultation-request",
        fields: [
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "lastName", label: "Last name", type: "text", required: false },
          { name: "phone", label: "Phone", type: "tel", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "interestedService", label: "Interested service", type: "text", required: false },
          { name: "preferredTime", label: "Preferred time", type: "text", required: false },
          { name: "message", label: "Message", type: "textarea", required: false },
        ],
      },
      workflow: {
        name: "New Consultation Lead Follow-Up",
        triggerType: "form_submitted",
        actionsJson: [
          {
            type: "send_sms",
            body: "Hey {{firstName}}, thanks for requesting a consultation. Want to book a time this week?",
          },
          {
            type: "send_email",
            subject: "Thanks for your consultation request",
            body: "We received your request and will follow up shortly.",
          },
          { type: "add_tag", tag: "consultation-lead" },
        ],
      },
    },
  },
  {
    slug: "system-roofer-estimate-request",
    name: "Roofer Estimate Request Blueprint",
    niche: "Roofing",
    description: "Estimate request form, inspection pipeline, and follow-up workflow for roofers.",
    items: {
      pipeline: {
        name: "Roofing Pipeline",
        isDefault: true,
        stages: [
          { name: "New Estimate Request", position: 0 },
          { name: "Contacted", position: 1 },
          { name: "Inspection Scheduled", position: 2 },
          { name: "Estimate Sent", position: 3 },
          { name: "Won", position: 4 },
          { name: "Lost", position: 5 },
        ],
      },
      form: {
        name: "Roofing Estimate Request",
        slug: "estimate-request",
        fields: [
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "lastName", label: "Last name", type: "text", required: false },
          { name: "phone", label: "Phone", type: "tel", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "propertyAddress", label: "Property address", type: "text", required: true },
          { name: "roofIssue", label: "Roof issue", type: "textarea", required: false },
          { name: "preferredTime", label: "Preferred time", type: "text", required: false },
          { name: "message", label: "Message", type: "textarea", required: false },
        ],
      },
      workflow: {
        name: "Estimate Request Follow-Up",
        triggerType: "form_submitted",
        actionsJson: [
          {
            type: "send_sms",
            body: "Hey {{firstName}}, thanks for requesting a roofing estimate. What is the best time to schedule an inspection?",
          },
          {
            type: "send_email",
            subject: "We received your roofing estimate request",
            body: "Thanks for reaching out. Our team will follow up to schedule your inspection.",
          },
          { type: "add_tag", tag: "estimate-request" },
        ],
      },
    },
  },
  {
    slug: "system-dentist-appointment-request",
    name: "Dentist Appointment Request Blueprint",
    niche: "Dentist",
    description: "Appointment request form, dental pipeline, and follow-up workflow for dentists.",
    items: {
      pipeline: {
        name: "Dental Pipeline",
        isDefault: true,
        stages: [
          { name: "New Appointment Request", position: 0 },
          { name: "Contacted", position: 1 },
          { name: "Appointment Booked", position: 2 },
          { name: "Treatment Accepted", position: 3 },
          { name: "Lost", position: 4 },
        ],
      },
      form: {
        name: "Dental Appointment Request",
        slug: "appointment-request",
        fields: [
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "lastName", label: "Last name", type: "text", required: false },
          { name: "phone", label: "Phone", type: "tel", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "appointmentReason", label: "Reason for appointment", type: "text", required: false },
          { name: "preferredTime", label: "Preferred time", type: "text", required: false },
          { name: "message", label: "Message", type: "textarea", required: false },
        ],
      },
      workflow: {
        name: "Appointment Request Follow-Up",
        triggerType: "form_submitted",
        actionsJson: [
          {
            type: "send_sms",
            body: "Hey {{firstName}}, thanks for requesting a dental appointment. What day works best for you?",
          },
          {
            type: "send_email",
            subject: "We received your appointment request",
            body: "Thanks for contacting us. We will follow up shortly to confirm a time.",
          },
          { type: "add_tag", tag: "appointment-request" },
        ],
      },
    },
  },
] as const;

async function seedSystemBlueprints() {
  for (const bp of SYSTEM_BLUEPRINTS) {
    const blueprint = await prisma.blueprint.upsert({
      where: { slug: bp.slug },
      create: {
        slug: bp.slug,
        name: bp.name,
        niche: bp.niche,
        description: bp.description,
        ownerType: "system",
      },
      update: {
        name: bp.name,
        niche: bp.niche,
        description: bp.description,
      },
    });

    // Replace items every time (idempotent)
    await prisma.blueprintItem.deleteMany({ where: { blueprintId: blueprint.id } });
    await prisma.blueprintItem.createMany({
      data: [
        { blueprintId: blueprint.id, itemType: "pipeline", payloadJson: bp.items.pipeline as object, position: 0 },
        { blueprintId: blueprint.id, itemType: "form", payloadJson: bp.items.form as object, position: 1 },
        { blueprintId: blueprint.id, itemType: "workflow", payloadJson: bp.items.workflow as object, position: 2 },
      ],
    });
  }
  console.log(`✓ Seeded ${SYSTEM_BLUEPRINTS.length} system blueprints`);
}

async function seedDemoAgencyAndTenant() {
  const agency = await prisma.agency.upsert({
    where: { slug: "spark-growth-systems" },
    create: { name: "Spark Growth Systems", slug: "spark-growth-systems" },
    update: { name: "Spark Growth Systems" },
  });

  const tenant = await prisma.tenant.upsert({
    where: {
      agencyId_slug: { agencyId: agency.id, slug: "brightskin-med-spa" },
    },
    create: {
      agencyId: agency.id,
      name: "BrightSkin Med Spa",
      slug: "brightskin-med-spa",
      status: "active",
    },
    update: { name: "BrightSkin Med Spa" },
  });

  // Default Sales Pipeline if it doesn't exist
  let pipeline = await prisma.pipeline.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
    include: { stages: { orderBy: { position: "asc" } } },
  });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        tenantId: tenant.id,
        name: "Sales Pipeline",
        isDefault: true,
        stages: {
          create: ["New Lead", "Contacted", "Booked", "Won", "Lost"].map((name, i) => ({
            tenantId: tenant.id,
            name,
            position: i,
          })),
        },
      },
      include: { stages: { orderBy: { position: "asc" } } },
    });
  }

  // Contacts (idempotent by email)
  const contactsData = [
    {
      firstName: "Sarah",
      lastName: "Miller",
      email: "sarah@example.com",
      phone: "+15551112222",
      source: "Consultation Request Form",
      tags: ["consultation-lead", "botox"],
      notes: "Interested in Botox consultation.",
    },
    {
      firstName: "Jessica",
      lastName: "Lee",
      email: "jessica@example.com",
      phone: "+15552223333",
      source: "Consultation Request Form",
      tags: ["consultation-lead", "laser-facial"],
      notes: "Interested in laser facial.",
    },
    {
      firstName: "Amanda",
      lastName: "Torres",
      email: "amanda@example.com",
      phone: "+15553334444",
      source: "Website Form",
      tags: ["consultation-lead"],
      notes: "Wants a general consultation.",
    },
  ];

  const contacts = await Promise.all(
    contactsData.map(async (c) => {
      const existing = await prisma.contact.findFirst({
        where: { tenantId: tenant.id, email: c.email },
      });
      if (existing) return existing;
      return prisma.contact.create({
        data: {
          tenantId: tenant.id,
          ...c,
          consentSms: true,
          consentEmail: true,
        },
      });
    }),
  );

  // Demo form
  const demoForm = await prisma.form.upsert({
    where: { slug: `${tenant.slug}-consultation-request` },
    create: {
      tenantId: tenant.id,
      name: "Consultation Request Form",
      slug: `${tenant.slug}-consultation-request`,
      isActive: true,
      schemaJson: {
        fields: [
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "lastName", label: "Last name", type: "text", required: false },
          { name: "phone", label: "Phone", type: "tel", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "interestedService", label: "Interested service", type: "text", required: false },
          { name: "preferredTime", label: "Preferred time", type: "text", required: false },
          { name: "message", label: "Message", type: "textarea", required: false },
        ],
      },
    },
    update: { isActive: true },
  });

  // Demo workflow (idempotent by name within tenant)
  const existingWorkflow = await prisma.workflowDefinition.findFirst({
    where: { tenantId: tenant.id, name: "New Consultation Lead Follow-Up" },
  });
  if (!existingWorkflow) {
    await prisma.workflowDefinition.create({
      data: {
        tenantId: tenant.id,
        name: "New Consultation Lead Follow-Up",
        triggerType: "form_submitted",
        isActive: true,
        actionsJson: [
          {
            type: "send_sms",
            body: "Hey {{firstName}}, thanks for requesting a consultation. Want to book a time this week?",
          },
          {
            type: "send_email",
            subject: "Thanks for your consultation request",
            body: "We received your request and will follow up shortly.",
          },
          { type: "add_tag", tag: "consultation-lead" },
        ],
      },
    });
  }

  // Demo opportunities (created only if no opportunities exist for tenant)
  const oppCount = await prisma.opportunity.count({ where: { tenantId: tenant.id } });
  if (oppCount === 0 && pipeline.stages.length > 0) {
    const stageByName = new Map(pipeline.stages.map((s) => [s.name, s.id]));
    const oppsToCreate = [
      { title: "Sarah Miller Botox Consultation", contact: contacts[0], value: "500", stage: "New Lead", source: "Consultation Request Form" },
      { title: "Jessica Lee Laser Facial", contact: contacts[1], value: "350", stage: "Contacted", source: "Consultation Request Form" },
      { title: "Amanda Torres Consultation", contact: contacts[2], value: "250", stage: "Booked", source: "Website Form" },
    ] as const;
    for (const o of oppsToCreate) {
      const stageId = stageByName.get(o.stage) ?? pipeline.stages[0].id;
      await prisma.opportunity.create({
        data: {
          tenantId: tenant.id,
          contactId: o.contact.id,
          pipelineId: pipeline.id,
          stageId,
          title: o.title,
          value: o.value,
          status: "open",
          source: o.source,
        },
      });
    }
  }

  console.log(`✓ Seeded agency "${agency.name}" with tenant "${tenant.name}"`);
  console.log(`  Public form URL: /forms/${demoForm.slug}`);
  console.log(`  Tenant dashboard: /app/${tenant.slug}/dashboard`);
}

async function main() {
  console.log("Seeding LeadOS…");
  await seedSystemBlueprints();
  await seedDemoAgencyAndTenant();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
