import { z } from "zod";
import {
  adminPlansQuerySchema,
  adminPlanRevisionSchema,
  createPlanDraftSchema,
  patchPlanDraftSchema,
} from "@/lib/contracts/admin/plans";
import {
  adminContentQuerySchema,
  adminContentRevisionSchema,
  createContentDraftSchema,
  patchContentDraftSchema,
} from "@/lib/contracts/admin/content";
import { parseApiError } from "@/lib/frontend/http-error";

const adminPlanRevisionEnvelopeSchema = z.object({
  success: z.literal(true),
  data: adminPlanRevisionSchema,
});

const adminPlanRevisionListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(adminPlanRevisionSchema),
});

const adminContentRevisionEnvelopeSchema = z.object({
  success: z.literal(true),
  data: adminContentRevisionSchema,
});

const adminContentRevisionListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(adminContentRevisionSchema),
});

const integrationSchema = z.object({
  provider: z.string(),
  status: z.enum(["active", "inactive", "invalid", "draft"]),
  public_config_json: z.record(z.string(), z.unknown()).nullable().optional(),
  last_validated_at: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const integrationListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(integrationSchema),
});

const integrationEnvelopeSchema = z.object({
  success: z.literal(true),
  data: integrationSchema,
});

const integrationRuntimeSyncEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    syncedAt: z.string(),
    dryRun: z.boolean(),
    summary: z.object({
      total: z.number(),
      active: z.number(),
      draft: z.number(),
      invalid: z.number(),
    }),
    items: z.array(
      z.object({
        provider: z.string(),
        status: z.enum(["active", "draft", "invalid"]),
        reason: z.string(),
        validatedAt: z.string().nullable(),
      }),
    ),
    integrations: z.array(integrationSchema),
  }),
});

const auditEventSchema = z.object({
  id: z.string().uuid(),
  actor_user_id: z.string().uuid(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string(),
  diff_json: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
});

const auditListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(auditEventSchema),
});

export async function getAdminPlans(query: z.input<typeof adminPlansQuerySchema> = {}) {
  const parsed = adminPlansQuerySchema.parse(query);
  const params = new URLSearchParams();
  if (parsed.status) params.set("status", parsed.status);
  if (parsed.locale) params.set("locale", parsed.locale);

  const response = await fetch(`/api/admin/plans?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw await parseApiError(response);
  return adminPlanRevisionListEnvelopeSchema.parse(await response.json()).data;
}

export async function createAdminPlanDraft(input: z.input<typeof createPlanDraftSchema>) {
  const parsed = createPlanDraftSchema.parse(input);
  const response = await fetch("/api/admin/plans/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });
  if (!response.ok) throw await parseApiError(response);
  return adminPlanRevisionEnvelopeSchema.parse(await response.json()).data;
}

export async function patchAdminPlanDraft(
  draftId: string,
  input: z.input<typeof patchPlanDraftSchema>,
  etag?: string,
) {
  const parsed = patchPlanDraftSchema.parse(input);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (etag) headers["If-Match"] = etag;

  const response = await fetch(`/api/admin/plans/drafts/${draftId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(parsed),
  });
  if (!response.ok) throw await parseApiError(response);
  return adminPlanRevisionEnvelopeSchema.parse(await response.json()).data;
}

export async function publishAdminPlanDraft(draftId: string, etag: string) {
  const response = await fetch(`/api/admin/plans/drafts/${draftId}/publish`, {
    method: "POST",
    headers: { "If-Match": etag },
  });
  if (!response.ok) throw await parseApiError(response);
  return adminPlanRevisionEnvelopeSchema.parse(await response.json()).data;
}

export async function getAdminContent(query: z.input<typeof adminContentQuerySchema>) {
  const parsed = adminContentQuerySchema.parse(query);
  const params = new URLSearchParams();
  params.set("page", parsed.page);
  params.set("locale", parsed.locale);
  if (parsed.status) params.set("status", parsed.status);

  const response = await fetch(`/api/admin/content?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw await parseApiError(response);
  return adminContentRevisionListEnvelopeSchema.parse(await response.json()).data;
}

export async function createAdminContentDraft(input: z.input<typeof createContentDraftSchema>) {
  const parsed = createContentDraftSchema.parse(input);
  const response = await fetch("/api/admin/content/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });
  if (!response.ok) throw await parseApiError(response);
  return adminContentRevisionEnvelopeSchema.parse(await response.json()).data;
}

export async function patchAdminContentDraft(
  draftId: string,
  input: z.input<typeof patchContentDraftSchema>,
  etag?: string,
) {
  const parsed = patchContentDraftSchema.parse(input);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (etag) headers["If-Match"] = etag;

  const response = await fetch(`/api/admin/content/drafts/${draftId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(parsed),
  });
  if (!response.ok) throw await parseApiError(response);
  return adminContentRevisionEnvelopeSchema.parse(await response.json()).data;
}

export async function publishAdminContentDraft(draftId: string, etag: string) {
  const response = await fetch(`/api/admin/content/drafts/${draftId}/publish`, {
    method: "POST",
    headers: { "If-Match": etag },
  });
  if (!response.ok) throw await parseApiError(response);
  return adminContentRevisionEnvelopeSchema.parse(await response.json()).data;
}

export async function getAdminIntegrations() {
  const response = await fetch("/api/admin/integrations", {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw await parseApiError(response);
  return integrationListEnvelopeSchema.parse(await response.json()).data;
}

export async function patchAdminIntegration(
  provider: string,
  input: {
    status?: "active" | "inactive" | "invalid" | "draft";
    publicConfig?: Record<string, unknown>;
    secretRef?: string | null;
    lastValidatedAt?: string | null;
  },
) {
  const response = await fetch(`/api/admin/integrations/${provider}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseApiError(response);
  return integrationEnvelopeSchema.parse(await response.json()).data;
}

export async function connectTelegramIntegration(input: {
  botToken?: string;
  useRuntime?: boolean;
  loginDomain?: string | null;
}) {
  const response = await fetch("/api/admin/integrations/telegram/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseApiError(response);
  return integrationEnvelopeSchema.parse(await response.json()).data;
}

export async function connectStripeIntegration(input: {
  secretKey?: string;
  useRuntime?: boolean;
  connectClientId?: string | null;
}) {
  const response = await fetch("/api/admin/integrations/stripe/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseApiError(response);
  return integrationEnvelopeSchema.parse(await response.json()).data;
}

export async function connectAsaasIntegration(input: {
  apiKey?: string;
  useRuntime?: boolean;
}) {
  const response = await fetch("/api/admin/integrations/asaas/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseApiError(response);
  return integrationEnvelopeSchema.parse(await response.json()).data;
}

export async function syncAdminIntegrationsRuntime(input: {
  providers?: string[];
  dryRun?: boolean;
} = {}) {
  const payload: Record<string, unknown> = {};
  if (input.providers) payload.providers = input.providers;
  if (typeof input.dryRun === "boolean") payload.dryRun = input.dryRun;

  const response = await fetch("/api/admin/integrations/runtime/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseApiError(response);
  return integrationRuntimeSyncEnvelopeSchema.parse(await response.json()).data;
}

export async function getAdminAuditEvents(limit = 100) {
  const response = await fetch(`/api/admin/audit/events?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw await parseApiError(response);
  return auditListEnvelopeSchema.parse(await response.json()).data;
}
