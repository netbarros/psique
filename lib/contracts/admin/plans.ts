import { z } from "zod";
import { flexibleDatetimeSchema } from "@/lib/contracts/datetime";

export const adminPlanStatusSchema = z.enum(["draft", "published", "archived"]);

export const planPayloadSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    headline: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().min(1).max(5000),
    currency: z.string().trim().length(3).default("BRL"),
    amountCents: z.number().int().min(0).max(10_000_000),
    interval: z.enum(["month", "year", "one_time"]).default("month"),
    ctaLabel: z.string().trim().min(1).max(120).optional(),
    ctaHref: z.string().trim().min(1).max(500).optional(),
    features: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
    flags: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const createPlanDraftSchema = z.object({
  planKey: z.string().trim().min(1).max(120),
  locale: z.string().trim().min(2).max(16).default("pt-BR"),
  payload: planPayloadSchema,
});

export const patchPlanDraftSchema = z
  .object({
    payload: planPayloadSchema.optional(),
    status: adminPlanStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

export const adminPlansQuerySchema = z.object({
  status: adminPlanStatusSchema.optional(),
  locale: z.string().trim().min(2).max(16).optional(),
});

export const adminPlanRevisionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  planKey: z.string(),
  locale: z.string(),
  version: z.number().int().min(1),
  status: adminPlanStatusSchema,
  etag: z.string(),
  payload: z.record(z.string(), z.unknown()),
  publishedAt: flexibleDatetimeSchema.nullable(),
  createdAt: flexibleDatetimeSchema,
  updatedAt: flexibleDatetimeSchema,
});

export type AdminPlanStatus = z.infer<typeof adminPlanStatusSchema>;
export type PlanPayload = z.infer<typeof planPayloadSchema>;
export type CreatePlanDraftInput = z.infer<typeof createPlanDraftSchema>;
export type PatchPlanDraftInput = z.infer<typeof patchPlanDraftSchema>;
export type AdminPlanRevision = z.infer<typeof adminPlanRevisionSchema>;
