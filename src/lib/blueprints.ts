import "server-only";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/utils";

/**
 * Blueprint installer.
 *
 * Idempotent: refuses to install twice into the same tenant (BlueprintInstall
 * has a unique (blueprintId, tenantId) index). On first install, creates the
 * appropriate pipeline/stages, forms, and workflow definitions described by
 * the blueprint's items.
 */
export type InstallResult = {
  alreadyInstalled: boolean;
  install?: {
    id: string;
    createdPipelineIds: string[];
    createdFormIds: string[];
    createdWorkflowIds: string[];
  };
};

type PipelinePayload = {
  name?: string;
  isDefault?: boolean;
  stages: { name: string; position?: number }[];
};

type FormPayload = {
  name: string;
  slug?: string;
  fields: {
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "select";
    required?: boolean;
    options?: string[];
    placeholder?: string;
  }[];
};

type WorkflowPayload = {
  name: string;
  triggerType: "form_submitted" | "opportunity_stage_changed" | "appointment_booked";
  actionsJson: unknown;
  isActive?: boolean;
};

export async function installBlueprintForTenant(args: {
  blueprintId: string;
  tenantId: string;
  userProfileId?: string | null;
}): Promise<InstallResult> {
  // Fast path: already installed.
  const existing = await prisma.blueprintInstall.findUnique({
    where: {
      blueprintId_tenantId: {
        blueprintId: args.blueprintId,
        tenantId: args.tenantId,
      },
    },
  });
  if (existing) {
    return { alreadyInstalled: true };
  }

  const blueprint = await prisma.blueprint.findUnique({
    where: { id: args.blueprintId },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!blueprint) {
    throw new Error("Blueprint not found");
  }

  // We do the entire install (claim row + create children) in one transaction
  // so a concurrent install racing past the fast-path check above fails on the
  // unique (blueprintId, tenantId) constraint instead of double-provisioning.
  let alreadyInstalledRace = false;
  let installId = "";
  const createdPipelineIds: string[] = [];
  const createdFormIds: string[] = [];
  const createdWorkflowIds: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      // Claim the install row first. If a concurrent caller beat us here, this
      // throws P2002 (unique constraint) and the catch below converts it into
      // the "already installed" response without rolling forward.
      const install = await tx.blueprintInstall.create({
        data: {
          blueprintId: args.blueprintId,
          tenantId: args.tenantId,
        },
      });
      installId = install.id;

      for (const item of blueprint.items) {
        if (item.itemType === "pipeline") {
          const p = item.payloadJson as unknown as PipelinePayload;
          const pipeline = await tx.pipeline.create({
            data: {
              tenantId: args.tenantId,
              name: p.name ?? "Sales Pipeline",
              isDefault: p.isDefault ?? false,
              stages: {
                create: p.stages.map((s, i) => ({
                  tenantId: args.tenantId,
                  name: s.name,
                  position: s.position ?? i,
                })),
              },
            },
          });
          createdPipelineIds.push(pipeline.id);
        } else if (item.itemType === "form") {
          const f = item.payloadJson as unknown as FormPayload;
          const baseSlug = f.slug ?? slugify(f.name);
          // Form.slug is globally unique, so prefix with the full tenant id to
          // guarantee no collision across two tenants installing the same
          // blueprint. (Old code used `slice(-6)` which could collide.)
          const slug = `${args.tenantId}-${baseSlug}`;
          const form = await tx.form.create({
            data: {
              tenantId: args.tenantId,
              name: f.name,
              slug,
              schemaJson: { fields: f.fields },
              isActive: true,
            },
          });
          createdFormIds.push(form.id);
        } else if (item.itemType === "workflow") {
          const w = item.payloadJson as unknown as WorkflowPayload;
          const workflow = await tx.workflowDefinition.create({
            data: {
              tenantId: args.tenantId,
              name: w.name,
              triggerType: w.triggerType,
              actionsJson: w.actionsJson as object,
              isActive: w.isActive ?? true,
            },
          });
          createdWorkflowIds.push(workflow.id);
        }
        // tag and setting item types are no-ops in Phase 1
      }

      await tx.blueprintInstall.update({
        where: { id: install.id },
        data: {
          resultJson: {
            createdPipelineIds,
            createdFormIds,
            createdWorkflowIds,
          },
        },
      });
    });
  } catch (err) {
    // Prisma unique-constraint code; the row was created by a concurrent
    // caller between our fast-path check and the transaction starting.
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2002"
    ) {
      alreadyInstalledRace = true;
    } else {
      throw err;
    }
  }

  if (alreadyInstalledRace) {
    return { alreadyInstalled: true };
  }

  await createAuditEvent({
    tenantId: args.tenantId,
    userProfileId: args.userProfileId ?? null,
    action: "blueprint.install",
    targetType: "BlueprintInstall",
    targetId: installId,
    metadata: { blueprintId: blueprint.id, blueprintName: blueprint.name },
  });

  return {
    alreadyInstalled: false,
    install: {
      id: installId,
      createdPipelineIds,
      createdFormIds,
      createdWorkflowIds,
    },
  };
}
