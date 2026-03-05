export interface ClassifiedAIError {
  code: string;
  message: string;
  status: number;
  providerStatus?: number;
}

function getProviderStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function classifyAIError(error: unknown): ClassifiedAIError {
  const providerStatus = getProviderStatus(error);
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("missing usable openrouter_api_key") || normalized.includes("missing openrouter_api_key")) {
    return {
      code: "AI_NOT_CONFIGURED",
      message: "IA indisponível: configure uma chave válida do OpenRouter em Integrações.",
      status: 500,
      providerStatus,
    };
  }

  if (providerStatus === 429 || normalized.includes("rate limit")) {
    return {
      code: "AI_PROVIDER_RATE_LIMIT",
      message: "Limite do provedor de IA atingido. Tente novamente em instantes.",
      status: 429,
      providerStatus,
    };
  }

  if (
    providerStatus === 401 ||
    providerStatus === 403 ||
    normalized.includes("invalid api key") ||
    normalized.includes("authentication")
  ) {
    return {
      code: "AI_PROVIDER_AUTH",
      message: "Falha de autenticação com o provedor de IA. Revalide a integração OpenRouter.",
      status: 500,
      providerStatus,
    };
  }

  if (providerStatus && providerStatus >= 500) {
    return {
      code: "AI_PROVIDER_UNAVAILABLE",
      message: "Serviço de IA indisponível no momento. Tente novamente em instantes.",
      status: 500,
      providerStatus,
    };
  }

  return {
    code: "AI_INTERNAL_ERROR",
    message: "Erro interno ao processar solicitação de IA.",
    status: 500,
    providerStatus,
  };
}

