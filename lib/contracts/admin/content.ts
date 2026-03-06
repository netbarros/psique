import { z } from "zod";
import { flexibleDatetimeSchema } from "@/lib/contracts/datetime";

export const adminContentStatusSchema = z.enum(["draft", "published", "archived"]);

export const contentPayloadSchema = z
  .object({
    title: z.string().trim().max(300).optional(),
    subtitle: z.string().trim().max(1000).optional(),
    body: z.string().trim().max(100_000).optional(),
    seo: z
      .object({
        title: z.string().trim().max(160).optional(),
        description: z.string().trim().max(300).optional(),
      })
      .partial()
      .optional(),
    blocks: z.array(z.record(z.string(), z.unknown())).optional(),
    ctas: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

export const adminContentQuerySchema = z.object({
  page: z.string().trim().min(1).max(120),
  locale: z.string().trim().min(2).max(16).default("pt-BR"),
  status: adminContentStatusSchema.optional(),
});

export const createContentDraftSchema = z.object({
  pageKey: z.string().trim().min(1).max(120),
  sectionKey: z.string().trim().min(1).max(120).default("main"),
  locale: z.string().trim().min(2).max(16).default("pt-BR"),
  payload: contentPayloadSchema,
});

export const patchContentDraftSchema = z
  .object({
    payload: contentPayloadSchema.optional(),
    status: adminContentStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

export const adminContentRevisionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  pageKey: z.string(),
  sectionKey: z.string(),
  locale: z.string(),
  version: z.number().int().min(1),
  status: adminContentStatusSchema,
  etag: z.string(),
  payload: z.record(z.string(), z.unknown()),
  publishedAt: flexibleDatetimeSchema.nullable(),
  createdAt: flexibleDatetimeSchema,
  updatedAt: flexibleDatetimeSchema,
});

export type AdminContentStatus = z.infer<typeof adminContentStatusSchema>;
export type ContentPayload = z.infer<typeof contentPayloadSchema>;
export type CreateContentDraftInput = z.infer<typeof createContentDraftSchema>;
export type PatchContentDraftInput = z.infer<typeof patchContentDraftSchema>;
export type AdminContentRevision = z.infer<typeof adminContentRevisionSchema>;
