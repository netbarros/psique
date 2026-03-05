import { z } from "zod";
import {
  publicContentItemSchema,
  publicContentQuerySchema,
  publicContentResponseSchema,
} from "@/lib/contracts/public/content";
import { publicPlanSchema, publicPlansQuerySchema } from "@/lib/contracts/public/plans";
import { parseApiError } from "@/lib/frontend/http-error";

const publicPlansResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(publicPlanSchema),
});

const publicContentEnvelopeSchema = z.object({
  success: z.literal(true),
  data: publicContentResponseSchema,
});

function resolveBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim().length > 0) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function getPublicPlans(locale = "pt-BR") {
  const parsed = publicPlansQuerySchema.parse({ locale });
  const base = resolveBaseUrl();
  const response = await fetch(
    `${base}/api/public/plans?locale=${encodeURIComponent(parsed.locale)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const json = await response.json();
  return publicPlansResponseSchema.parse(json).data;
}

export async function getPublicContent(page: string, locale = "pt-BR") {
  const parsed = publicContentQuerySchema.parse({ page, locale });
  const base = resolveBaseUrl();
  const response = await fetch(
    `${base}/api/public/content?page=${encodeURIComponent(parsed.page)}&locale=${encodeURIComponent(parsed.locale)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const json = await response.json();
  return publicContentEnvelopeSchema.parse(json).data;
}

export function getContentSection(
  content: z.infer<typeof publicContentResponseSchema>,
  sectionKey = "main",
): z.infer<typeof publicContentItemSchema> | null {
  const entry = content.items.find((item) => item.sectionKey === sectionKey);
  return entry ?? null;
}
