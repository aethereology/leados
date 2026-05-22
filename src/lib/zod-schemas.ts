import { z } from "zod";

const slugRule = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.");

export const agencyCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugRule.optional(),
});

export const tenantCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugRule.optional(),
});

export const contactSchema = z.object({
  firstName: z.string().max(80).optional().or(z.literal("")),
  lastName: z.string().max(80).optional().or(z.literal("")),
  email: z
    .string()
    .email()
    .max(180)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  source: z.string().max(120).optional().or(z.literal("")),
  tags: z.string().max(500).optional().or(z.literal("")), // comma-separated in forms
  notes: z.string().max(4000).optional().or(z.literal("")),
  consentSms: z.coerce.boolean().optional(),
  consentEmail: z.coerce.boolean().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const opportunitySchema = z.object({
  title: z.string().min(1).max(180),
  contactId: z.string().optional().or(z.literal("")),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  value: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(0).optional()),
  status: z.enum(["open", "won", "lost"]).optional(),
  source: z.string().max(120).optional().or(z.literal("")),
});
export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const opportunityMoveSchema = z.object({
  opportunityId: z.string().min(1),
  stageId: z.string().min(1),
});

export const formFieldSchema = z.object({
  name: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  type: z.enum(["text", "email", "tel", "textarea", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().max(120).optional(),
});

export const formSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugRule.optional(),
  isActive: z.coerce.boolean().optional().default(true),
  fields: z.array(formFieldSchema).min(1),
});
export type FormInput = z.infer<typeof formSchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;

export const workflowSchema = z.object({
  name: z.string().min(2).max(120),
  triggerType: z.enum([
    "form_submitted",
    "opportunity_stage_changed",
    "appointment_booked",
  ]),
  actionsJson: z.string().min(2), // JSON string from a textarea
  isActive: z.coerce.boolean().optional().default(true),
});
export type WorkflowInput = z.infer<typeof workflowSchema>;

export const settingsSchema = z.object({
  name: z.string().min(2).max(120),
  businessInfoJson: z.string().optional().or(z.literal("")),
});

export const blueprintCreateSchema = z.object({
  name: z.string().min(2).max(120),
  niche: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const messageSendSchema = z.object({
  channel: z.enum(["sms", "email"]),
  body: z.string().min(1, "Message body is required.").max(4000),
  subject: z.preprocess(
    (value) => (value == null ? "" : value),
    z.string().max(180),
  ),
});
export type MessageSendInput = z.infer<typeof messageSendSchema>;
