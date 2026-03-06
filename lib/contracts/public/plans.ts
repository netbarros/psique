import { z } from "zod";
import { flexibleDatetimeSchema } from "@/lib/contracts/datetime";

export const publicPlansQuerySchema = z.object({
  locale: z.string().trim().min(2).max(16).default("pt-BR"),
});

export const publicPlanSchema = z.object({
  id: z.string().uuid(),
  planKey: z.string(),
  locale: z.string(),
  version: z.number().int().min(1),
  etag: z.string(),
  payload: z.record(z.string(), z.unknown()),
  publishedAt: flexibleDatetimeSchema.nullable(),
});

export type PublicPlan = z.infer<typeof publicPlanSchema>;
