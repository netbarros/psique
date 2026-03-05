import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeOpenRouterApiKeyCandidate } from "@/lib/api/openrouter-key";
import { logger } from "@/lib/logger";
import type { Json, PlatformIntegrationStatus } from "@/lib/database.types";

const OPENROUTER_PROVIDER = "openrouter";

export type OpenRouterModelSource = "therapist" | "platform" | "default";
export type OpenRouterKeySource = "therapist" | "platform_secret_ref" | "platform_env_ref" | "env" | "missing";

export interface OpenRouterRuntimeConfig {
  model?: string;
  modelUsed: string;
  modelSource: OpenRouterModelSource;
  apiKey?: string;
  keySource: OpenRouterKeySource;
}

type PlatformIntegrationRow = {
  provider: string;
  status: PlatformIntegrationStatus;
  public_config_json: Json;
  secret_ref: string | null;
};

function sanitizeModelCandidate(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractModelFromPublicConfig(config: Json): string | undefined {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return undefined;
  }

  const payload = config as Record<string, unknown>;
  if (typeof payload.model === "string") {
    return sanitizeModelCandidate(payload.model);
  }
  if (typeof payload.defaultModel === "string") {
    return sanitizeModelCandidate(payload.defaultModel);
  }

  return undefined;
}

function resolveKeyFromSecretRef(secretRef?: string | null): { apiKey?: string; keySource?: OpenRouterKeySource } {
  const reference = secretRef?.trim();
  if (!reference) {
    return {};
  }

  const directKey = sanitizeOpenRouterApiKeyCandidate(reference);
  if (directKey) {
    return { apiKey: directKey, keySource: "platform_secret_ref" };
  }

  const envMatch = reference.match(/^env(?::|:\/\/)([A-Z0-9_]+)$/i);
  if (!envMatch?.[1]) {
    return {};
  }

  const envKey = envMatch[1];
  const envValue = sanitizeOpenRouterApiKeyCandidate(process.env[envKey]);
  if (!envValue) {
    return {};
  }

  return {
    apiKey: envValue,
    keySource: "platform_env_ref",
  };
}

async function fetchOpenRouterIntegration(route: string): Promise<PlatformIntegrationRow | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_integrations")
      .select("provider, status, public_config_json, secret_ref")
      .eq("provider", OPENROUTER_PROVIDER)
      .single();

    if (error || !data) {
      return null;
    }

    return data as PlatformIntegrationRow;
  } catch (error) {
    logger.warn("[OpenRouterRuntime] Unable to fetch platform integration", {
      route,
      error: String(error),
    });
    return null;
  }
}

export async function resolveOpenRouterRuntimeConfig(params: {
  route: string;
  defaultModel: string;
  therapistModel?: string | null;
  therapistApiKeyCandidate?: string | null;
}): Promise<OpenRouterRuntimeConfig> {
  const therapistModel = sanitizeModelCandidate(params.therapistModel);
  const therapistApiKey = sanitizeOpenRouterApiKeyCandidate(params.therapistApiKeyCandidate);

  let platformModel: string | undefined;
  let platformApiKey: string | undefined;
  let platformKeySource: OpenRouterKeySource | undefined;

  if (!therapistModel || !therapistApiKey) {
    const integration = await fetchOpenRouterIntegration(params.route);
    if (integration && integration.status === "active") {
      if (!therapistModel) {
        platformModel = extractModelFromPublicConfig(integration.public_config_json);
      }
      if (!therapistApiKey) {
        const platformKey = resolveKeyFromSecretRef(integration.secret_ref);
        platformApiKey = platformKey.apiKey;
        platformKeySource = platformKey.keySource;
      }
    }
  }

  const model = therapistModel ?? platformModel ?? params.defaultModel;
  const modelSource: OpenRouterModelSource = therapistModel
    ? "therapist"
    : platformModel
      ? "platform"
      : "default";

  const envApiKey = sanitizeOpenRouterApiKeyCandidate(process.env.OPENROUTER_API_KEY);
  const apiKey = therapistApiKey ?? platformApiKey ?? envApiKey;
  const keySource: OpenRouterKeySource = therapistApiKey
    ? "therapist"
    : platformApiKey
      ? (platformKeySource ?? "platform_secret_ref")
      : envApiKey
        ? "env"
        : "missing";

  return {
    model,
    modelUsed: model,
    modelSource,
    apiKey,
    keySource,
  };
}
