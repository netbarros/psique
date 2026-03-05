import { z } from "zod";

export const publicContentQuerySchema = z.object({
  page: z.string().trim().min(1).max(120),
  locale: z.string().trim().min(2).max(16).default("pt-BR"),
});

export const publicContentItemSchema = z.object({
  id: z.string().uuid(),
  sectionKey: z.string(),
  version: z.number().int().min(1),
  etag: z.string(),
  payload: z.record(z.string(), z.unknown()),
  publishedAt: z.string().datetime().nullable(),
});

export const publicContentResponseSchema = z.object({
  pageKey: z.string(),
  locale: z.string(),
  items: z.array(publicContentItemSchema),
});

export type PublicContentItem = z.infer<typeof publicContentItemSchema>;
