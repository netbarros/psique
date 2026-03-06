"use client";

import { useEffect, useMemo, useState } from "react";
import {
  connectAsaasIntegration,
  connectStripeIntegration,
  connectTelegramIntegration,
  getAdminIntegrations,
  patchAdminIntegration,
  syncAdminIntegrationsRuntime,
} from "@/lib/frontend/admin-client";
import { FrontendHttpError } from "@/lib/frontend/http-error";

type IntegrationStatus = "active" | "inactive" | "invalid" | "draft";
type IntegrationRow = Awaited<ReturnType<typeof getAdminIntegrations>>[number];
type NoticeTone = "error" | "success" | "warning";
type NoticeState = { tone: NoticeTone; message: string } | null;

const suggestedProviders = [
  "openrouter",
  "telegram",
  "stripe",
  "asaas",
  "daily",
  "resend",
  "upstash",
  "sentry",
  "demo",
] as const;

const runtimeSyncProviders = ["openrouter", "telegram", "stripe", "asaas", "daily", "resend", "upstash", "sentry", "demo"] as const;

const runtimeEnvPlaybook = [
  {
    provider: "openrouter",
    mode: "API key",
    envs: ["OPENROUTER_API_KEY", "OPENROUTER_DEFAULT_MODEL (opcional)"],
    notes: "Validação automática em /models.",
  },
  {
    provider: "telegram",
    mode: "Token + Login Widget",
    envs: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_LOGIN_DOMAIN (opcional)"],
    notes: "Validação real via getMe; login domain precisa ser público HTTPS.",
  },
  {
    provider: "stripe",
    mode: "OAuth + API key",
    envs: ["STRIPE_SECRET_KEY", "STRIPE_CONNECT_CLIENT_ID (ou STRIPE_CLIENT_ID)"],
    notes: "OAuth fica ready quando client ID está configurado no runtime.",
  },
  {
    provider: "asaas",
    mode: "API key",
    envs: ["ASAAS_API_KEY (ou ASAAS_ACCESS_TOKEN / ASAAS_TOKEN)"],
    notes: "Validação real via /v3/myAccount.",
  },
  {
    provider: "daily",
    mode: "API key",
    envs: ["DAILY_API_KEY", "DAILY_API_URL (opcional)"],
    notes: "Validação automática consultando /rooms.",
  },
  {
    provider: "resend",
    mode: "API key",
    envs: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_FROM_NAME (opcional)"],
    notes: "Validação automática em /domains.",
  },
  {
    provider: "upstash",
    mode: "Redis REST token",
    envs: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    notes: "Validação automática com PING para rate limiting.",
  },
  {
    provider: "sentry",
    mode: "DSN",
    envs: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"],
    notes: "Validação sintática de DSN server/client.",
  },
] as const;

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function safeJsonParse(value: string) {
  return JSON.parse(value) as Record<string, unknown>;
}

function parseDateString(value: string | null | undefined) {
  if (!value) return null;
  const withTimeSeparator = value.includes("T") ? value : value.replace(" ", "T");
  const normalized = withTimeSeparator.replace(/([+-]\d{2})$/, "$1:00");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDatetimeLocal(isoDate: string | null | undefined) {
  const parsed = parseDateString(isoDate);
  if (!parsed) return "";
  return parsed.toISOString().slice(0, 16);
}

function formatDate(isoDate: string | null | undefined) {
  const parsed = parseDateString(isoDate);
  if (!parsed) return "—";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fromDatetimeLocal(input: string) {
  if (!input.trim()) return null;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeProviderKey(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "_");
}

function isValidProviderKey(input: string) {
  return /^[a-z0-9][a-z0-9._-]{0,119}$/.test(input);
}

function sortProviders(items: IntegrationRow[]) {
  return [...items].sort((a, b) => a.provider.localeCompare(b.provider));
}

function extractTelegramLoginDomain(config: IntegrationRow["public_config_json"]): string {
  const root = asRecord(config);
  const loginWidget = asRecord(root.loginWidget);
  const value = loginWidget.loginDomain;
  return typeof value === "string" ? value : "";
}

function extractTelegramBotUsername(config: IntegrationRow["public_config_json"]): string | null {
  const root = asRecord(config);
  const connectedAccount = asRecord(root.connectedAccount);
  if (typeof connectedAccount.botUsername === "string" && connectedAccount.botUsername.trim()) {
    return connectedAccount.botUsername;
  }
  const loginWidget = asRecord(root.loginWidget);
  if (typeof loginWidget.botUsername === "string" && loginWidget.botUsername.trim()) {
    return loginWidget.botUsername;
  }
  return null;
}

function extractStripeConnectClientId(config: IntegrationRow["public_config_json"]): string {
  const root = asRecord(config);
  const oauth = asRecord(root.oauth);
  const value = oauth.connectClientId;
  return typeof value === "string" ? value : "";
}

function extractStripeAccountId(config: IntegrationRow["public_config_json"]): string | null {
  const root = asRecord(config);
  const connectedAccount = asRecord(root.connectedAccount);
  if (typeof connectedAccount.accountId === "string" && connectedAccount.accountId.trim()) {
    return connectedAccount.accountId;
  }
  const validation = asRecord(root.validation);
  if (typeof validation.accountId === "string" && validation.accountId.trim()) {
    return validation.accountId;
  }
  return null;
}

function extractAsaasWalletId(config: IntegrationRow["public_config_json"]): string | null {
  const root = asRecord(config);
  const connectedAccount = asRecord(root.connectedAccount);
  if (typeof connectedAccount.walletId === "string" && connectedAccount.walletId.trim()) {
    return connectedAccount.walletId;
  }
  const validation = asRecord(root.validation);
  if (typeof validation.walletId === "string" && validation.walletId.trim()) {
    return validation.walletId;
  }
  return null;
}

function statusBadgeClass(status: IntegrationStatus) {
  if (status === "active") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "invalid") return "border-error/30 bg-error/10 text-error";
  if (status === "draft") return "border-gold/30 bg-gold/10 text-gold";
  return "border-border-subtle bg-bg-base text-text-muted";
}

function Notice({ notice }: { notice: NonNullable<NoticeState> }) {
  const toneClass =
    notice.tone === "success"
      ? "border-brand/30 bg-brand/10 text-brand"
      : notice.tone === "warning"
        ? "border-gold/30 bg-gold/10 text-gold"
        : "border-error/30 bg-error/10 text-error";

  return <p className={`rounded-xl border px-3 py-2 text-sm ${toneClass}`}>{notice.message}</p>;
}

function toSaveErrorMessage(caughtError: unknown) {
  const isProviderConnectCode = (value: string | undefined) =>
    Boolean(value && /(TELEGRAM|STRIPE|ASAAS|RUNTIME_SYNC|OPENROUTER|DAILY|RESEND|UPSTASH|SENTRY)_/.test(value));
  const isProviderConnectMessage = (value: string) =>
    /(TELEGRAM|STRIPE|ASAAS|RUNTIME_SYNC|OPENROUTER|DAILY|RESEND|UPSTASH|SENTRY)_/.test(value);

  if (caughtError instanceof SyntaxError) {
    return {
      tone: "warning" as const,
      message: "JSON inválido em `publicConfig`.",
    };
  }

  if (caughtError instanceof FrontendHttpError) {
    const shouldSurfaceProviderError =
      isProviderConnectMessage(caughtError.message) || isProviderConnectCode(caughtError.code);

    if (caughtError.status === 400) {
      return {
        tone: "warning" as const,
        message: "Requisição inválida (`400`). Revise os campos enviados.",
      };
    }
    if (caughtError.status === 401) {
      return {
        tone: "warning" as const,
        message: "Sessão expirada (`401`). Faça login novamente.",
      };
    }
    if (caughtError.status === 403) {
      return {
        tone: "warning" as const,
        message: "Acesso negado (`403`). Esta tela é exclusiva de `master_admin`.",
      };
    }
    if (caughtError.status === 404) {
      return {
        tone: "warning" as const,
        message: "Provider não encontrado (`404`). Recarregue a lista e tente novamente.",
      };
    }
    if (caughtError.status === 409) {
      return {
        tone: "warning" as const,
        message: shouldSurfaceProviderError
          ? caughtError.message
          : "Conflito de atualização (`409`). Recarregue os dados antes de tentar novamente.",
      };
    }
    if (caughtError.status === 422) {
      return {
        tone: "warning" as const,
        message: shouldSurfaceProviderError
          ? caughtError.message
          : "Payload inválido (`422`). Revise `status`, `publicConfig` e `lastValidatedAt`.",
      };
    }
    return {
      tone: "error" as const,
      message: caughtError.message,
    };
  }

  if (caughtError instanceof Error) {
    return {
      tone: "error" as const,
      message: caughtError.message,
    };
  }

  return {
    tone: "error" as const,
    message: "Falha ao salvar integração.",
  };
}

export function IntegrationsAdminClient() {
  const [items, setItems] = useState<IntegrationRow[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState("");
  const [newProvider, setNewProvider] = useState("");
  const [status, setStatus] = useState<IntegrationStatus>("inactive");
  const [publicConfigJson, setPublicConfigJson] = useState("{}");
  const [secretRef, setSecretRef] = useState("");
  const [lastValidatedAt, setLastValidatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [connectingAsaas, setConnectingAsaas] = useState(false);
  const [syncingRuntime, setSyncingRuntime] = useState(false);
  const [runtimeDryRun, setRuntimeDryRun] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramLoginDomain, setTelegramLoginDomain] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeConnectClientId, setStripeConnectClientId] = useState("");
  const [asaasApiKey, setAsaasApiKey] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);

  function mergeRuntimeSyncIntegrations(next: IntegrationRow[]) {
    setItems((previous) => {
      const byProvider = new Map(previous.map((item) => [item.provider, item]));
      for (const item of next) {
        byProvider.set(item.provider, item);
      }
      return sortProviders(Array.from(byProvider.values()));
    });
    setSelectedProvider((currentProvider) => {
      if (!currentProvider) return next[0]?.provider ?? null;
      return currentProvider;
    });
  }

  async function load() {
    setLoading(true);
    try {
      const data = sortProviders(await getAdminIntegrations());
      setItems(data);
      setSelectedProvider((currentProvider) => {
        if (!currentProvider) return data[0]?.provider ?? null;
        if (data.some((item) => item.provider === currentProvider)) return currentProvider;
        return data[0]?.provider ?? null;
      });
    } catch (caughtError) {
      setNotice({
        tone: "error",
        message: caughtError instanceof Error ? caughtError.message : "Falha ao carregar integrações.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = providerFilter.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.provider.toLowerCase().includes(normalized));
  }, [items, providerFilter]);

  const selected = useMemo(
    () => items.find((item) => item.provider === selectedProvider) ?? null,
    [items, selectedProvider],
  );

  const counts = useMemo(() => {
    const summary = {
      total: items.length,
      active: 0,
      inactive: 0,
      invalid: 0,
      draft: 0,
    };

    for (const item of items) {
      summary[item.status] += 1;
    }

    return summary;
  }, [items]);

  useEffect(() => {
    if (!selected) {
      setStatus("inactive");
      setPublicConfigJson("{}");
      setSecretRef("");
      setLastValidatedAt("");
      setTelegramBotToken("");
      setTelegramLoginDomain("");
      setStripeSecretKey("");
      setStripeConnectClientId("");
      setAsaasApiKey("");
      return;
    }

    setStatus(selected.status);
    setPublicConfigJson(JSON.stringify(selected.public_config_json ?? {}, null, 2));
    setSecretRef("");
    setLastValidatedAt(toDatetimeLocal(selected.last_validated_at));
    setTelegramBotToken("");
    setTelegramLoginDomain(selected.provider === "telegram" ? extractTelegramLoginDomain(selected.public_config_json) : "");
    setStripeSecretKey("");
    setStripeConnectClientId(
      selected.provider === "stripe" ? extractStripeConnectClientId(selected.public_config_json) : "",
    );
    setAsaasApiKey("");
  }, [selected]);

  async function createProvider(providerInput?: string) {
    const candidate = normalizeProviderKey(providerInput ?? newProvider);
    if (!candidate) {
      setNotice({
        tone: "warning",
        message: "Informe um provider válido para cadastrar a integração.",
      });
      return;
    }

    if (!isValidProviderKey(candidate)) {
      setNotice({
        tone: "warning",
        message: "Provider inválido. Use apenas letras minúsculas, números, `_`, `-` e `.`.",
      });
      return;
    }

    if (items.some((item) => item.provider === candidate)) {
      setSelectedProvider(candidate);
      setNotice({
        tone: "warning",
        message: `Provider \`${candidate}\` já existe. Selecionamos a integração existente.`,
      });
      return;
    }

    setCreatingProvider(true);
    setNotice(null);
    try {
      const created = await patchAdminIntegration(candidate, {
        status: "inactive",
        publicConfig: {},
      });

      setItems((previous) => sortProviders([...previous, created]));
      setSelectedProvider(created.provider);
      setNewProvider("");
      setNotice({
        tone: "success",
        message: `Provider \`${created.provider}\` criado com sucesso.`,
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setCreatingProvider(false);
    }
  }

  async function createSuggestedProviders() {
    setCreatingProvider(true);
    setNotice(null);
    try {
      const missingProviders = suggestedProviders.filter(
        (provider) => !items.some((item) => item.provider === provider),
      );

      if (missingProviders.length === 0) {
        setNotice({
          tone: "warning",
          message: "Providers padrão já estão cadastrados.",
        });
        return;
      }

      const createdItems: IntegrationRow[] = [];
      for (const provider of missingProviders) {
        // Keep sequential writes to preserve deterministic audit order.
        const created = await patchAdminIntegration(provider, {
          status: "inactive",
          publicConfig: {},
        });
        createdItems.push(created);
      }

      setItems((previous) => sortProviders([...previous, ...createdItems]));
      setSelectedProvider(createdItems[0]?.provider ?? null);
      setNotice({
        tone: "success",
        message: `Stack inicial criada: ${createdItems.map((item) => item.provider).join(", ")}.`,
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setCreatingProvider(false);
    }
  }

  async function syncRuntimeIntegrations() {
    setSyncingRuntime(true);
    setNotice(null);
    try {
      const result = await syncAdminIntegrationsRuntime({
        providers: [...runtimeSyncProviders],
        dryRun: runtimeDryRun,
      });

      if (!result.dryRun && result.integrations.length > 0) {
        mergeRuntimeSyncIntegrations(result.integrations);
      }

      const summaryText = `active ${result.summary.active} · draft ${result.summary.draft} · invalid ${result.summary.invalid}`;
      const firstInvalid = result.items.find((item) => item.status === "invalid");
      setNotice({
        tone: firstInvalid ? "warning" : "success",
        message: result.dryRun
          ? `Dry run concluído (${summaryText}).`
          : firstInvalid
            ? `Sync aplicado (${summaryText}). Primeiro erro: ${firstInvalid.provider} — ${firstInvalid.reason}`
            : `Sync aplicado com sucesso (${summaryText}).`,
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setSyncingRuntime(false);
    }
  }

  async function save() {
    if (!selectedProvider) return;
    setSaving(true);
    setNotice(null);

    try {
      const parsedPublicConfig = safeJsonParse(publicConfigJson);
      const updated = await patchAdminIntegration(selectedProvider, {
        status,
        publicConfig: parsedPublicConfig,
        secretRef: secretRef.trim() ? secretRef.trim() : undefined,
        lastValidatedAt: fromDatetimeLocal(lastValidatedAt),
      });

      setItems((previous) =>
        sortProviders([
          ...previous.filter((item) => item.provider !== updated.provider),
          updated,
        ]),
      );
      setSelectedProvider(updated.provider);
      setSecretRef("");
      setNotice({
        tone: "success",
        message: "Integração salva com sucesso.",
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setSaving(false);
    }
  }

  async function connectTelegramAccount() {
    if (!selected || selected.provider !== "telegram") return;

    const botToken = telegramBotToken.trim();
    const useRuntime = botToken.length === 0;

    setConnectingTelegram(true);
    setNotice(null);
    try {
      const updated = await connectTelegramIntegration({
        botToken: useRuntime ? undefined : botToken,
        useRuntime,
        loginDomain: telegramLoginDomain.trim() ? telegramLoginDomain.trim() : undefined,
      });

      setItems((previous) =>
        sortProviders([
          ...previous.filter((item) => item.provider !== updated.provider),
          updated,
        ]),
      );
      setSelectedProvider(updated.provider);
      setTelegramBotToken("");
      const botUsername = extractTelegramBotUsername(updated.public_config_json);
      setNotice({
        tone: "success",
        message: botUsername
          ? `Telegram ${useRuntime ? "sincronizado via runtime" : "conectado"} com sucesso (${botUsername}).`
          : `Telegram ${useRuntime ? "sincronizado via runtime" : "conectado"} com sucesso.`,
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setConnectingTelegram(false);
    }
  }

  async function connectStripeAccount() {
    if (!selected || selected.provider !== "stripe") return;

    const secretKey = stripeSecretKey.trim();
    const useRuntime = secretKey.length === 0;

    setConnectingStripe(true);
    setNotice(null);
    try {
      const updated = await connectStripeIntegration({
        secretKey: useRuntime ? undefined : secretKey,
        useRuntime,
        connectClientId: stripeConnectClientId.trim() ? stripeConnectClientId.trim() : undefined,
      });

      setItems((previous) =>
        sortProviders([
          ...previous.filter((item) => item.provider !== updated.provider),
          updated,
        ]),
      );
      setSelectedProvider(updated.provider);
      setStripeSecretKey("");
      const accountId = extractStripeAccountId(updated.public_config_json);
      setNotice({
        tone: "success",
        message: accountId
          ? `Stripe ${useRuntime ? "sincronizado via runtime" : "conectado"} com sucesso (${accountId}).`
          : `Stripe ${useRuntime ? "sincronizado via runtime" : "conectado"} com sucesso.`,
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setConnectingStripe(false);
    }
  }

  async function connectAsaasAccount() {
    if (!selected || selected.provider !== "asaas") return;

    const apiKey = asaasApiKey.trim();
    const useRuntime = apiKey.length === 0;

    setConnectingAsaas(true);
    setNotice(null);
    try {
      const updated = await connectAsaasIntegration({
        apiKey: useRuntime ? undefined : apiKey,
        useRuntime,
      });

      setItems((previous) =>
        sortProviders([
          ...previous.filter((item) => item.provider !== updated.provider),
          updated,
        ]),
      );
      setSelectedProvider(updated.provider);
      setAsaasApiKey("");
      const walletId = extractAsaasWalletId(updated.public_config_json);
      setNotice({
        tone: "success",
        message: walletId
          ? `Asaas ${useRuntime ? "sincronizado via runtime" : "conectado"} com sucesso (${walletId}).`
          : `Asaas ${useRuntime ? "sincronizado via runtime" : "conectado"} com sucesso.`,
      });
    } catch (caughtError) {
      const result = toSaveErrorMessage(caughtError);
      setNotice(result);
    } finally {
      setConnectingAsaas(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <aside className="space-y-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl">Provedores</h3>
          <span className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary">
            {counts.total}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">active</p>
            <p className="mt-1 text-sm font-semibold text-brand">{counts.active}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">inactive</p>
            <p className="mt-1 text-sm font-semibold text-text-secondary">{counts.inactive}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">invalid</p>
            <p className="mt-1 text-sm font-semibold text-error">{counts.invalid}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">draft</p>
            <p className="mt-1 text-sm font-semibold text-gold">{counts.draft}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <p className="text-xs uppercase tracking-wider text-text-muted">Cadastrar provider</p>
          <div className="flex gap-2">
            <input
              value={newProvider}
              onChange={(event) => setNewProvider(event.target.value)}
              placeholder="ex.: openrouter"
              className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary"
            />
            <button
              type="button"
              onClick={() => void createProvider()}
              disabled={creatingProvider}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => void createProvider(provider)}
                disabled={creatingProvider || items.some((item) => item.provider === provider)}
                className="rounded-full border border-border-subtle bg-bg-base px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {provider}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void createSuggestedProviders()}
            disabled={creatingProvider}
            className="w-full rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-secondary transition-colors hover:border-brand/30 hover:text-brand disabled:opacity-60"
          >
            {creatingProvider ? "Inicializando..." : "Inicializar stack padrão"}
          </button>
        </div>

        <input
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          placeholder="Filtrar provider"
          className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary"
        />

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
              Carregando integrações...
            </p>
          ) : null}
          {!loading && filteredItems.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
              Nenhuma integração encontrada para o filtro.
            </p>
          ) : null}
          {filteredItems.map((item) => (
            <button
              key={item.provider}
              type="button"
              onClick={() => setSelectedProvider(item.provider)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                selectedProvider === item.provider
                  ? "border-brand/40 bg-brand/10 text-text-primary"
                  : "border-border-subtle bg-bg-elevated text-text-secondary hover:border-brand/30 hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{item.provider}</p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClass(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-text-muted">
                validated: {item.last_validated_at ? toDatetimeLocal(item.last_validated_at) || "—" : "—"}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <article className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {notice ? <Notice notice={notice} /> : null}

        <section className="space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
          <div className="space-y-1">
            <h3 className="font-display text-3xl">Runtime Sync (ENV)</h3>
            <p className="text-sm text-text-secondary">
              Sincroniza provedores com o runtime real do servidor e valida conectividade automaticamente para reduzir
              drift entre painel e infraestrutura.
            </p>
            <p className="text-xs text-text-muted">
              OAuth é priorizado quando aplicável (Stripe). Demais provedores usam validação por API key/DSN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={runtimeDryRun}
                onChange={(event) => setRuntimeDryRun(event.target.checked)}
                className="accent-brand"
              />
              Dry run (sem persistir)
            </label>
            <button
              type="button"
              onClick={() => void syncRuntimeIntegrations()}
              disabled={syncingRuntime || loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {syncingRuntime ? "Sincronizando..." : "Sync Runtime (ENV)"}
            </button>
            <span className="text-xs text-text-muted">
              Providers: {runtimeSyncProviders.join(", ")}
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {runtimeEnvPlaybook.map((item) => (
              <article
                key={item.provider}
                className="space-y-1 rounded-lg border border-border-subtle bg-bg-elevated p-3"
              >
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  {item.provider} · {item.mode}
                </p>
                <p className="text-[11px] text-text-secondary">{item.envs.join(" · ")}</p>
                <p className="text-[11px] text-text-muted">{item.notes}</p>
              </article>
            ))}
          </div>
        </section>

        {!selected ? (
          <div className="space-y-2 rounded-xl border border-border-subtle bg-bg-elevated p-4">
            <p className="text-sm text-text-secondary">Selecione um provider para editar configuração e status.</p>
            {items.length === 0 ? (
              <p className="text-xs text-text-muted">
                Nenhum provider cadastrado ainda. Use “Cadastrar provider” para iniciar o domínio de integrações.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <header className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-3xl">{selected.provider}</h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClass(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Segredos não são exibidos em leitura. Envie `secretRef` apenas quando precisar rotacionar referência.
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Criado: {formatDate(selected.created_at)} · Atualizado: {formatDate(selected.updated_at)} ·
                Validado: {formatDate(selected.last_validated_at)} · updated_by: {selected.updated_by ?? "—"}
              </p>
            </header>

            {selected.provider === "telegram" ? (
              <section className="space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
                <div className="space-y-1">
                  <h4 className="font-display text-2xl text-text-primary">Connect Telegram Account</h4>
                  <p className="text-sm text-text-secondary">
                    Fluxo real estilo Composio: valide o Bot Token no Telegram (`getMe`) e sincronize o provider com
                    o runtime.
                  </p>
                  <p className="text-xs text-text-muted">
                    Se o campo ficar vazio, o backend usa `TELEGRAM_BOT_TOKEN` do runtime automaticamente.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                      bot token (opcional)
                    </span>
                    <input
                      type="password"
                      value={telegramBotToken}
                      onChange={(event) => setTelegramBotToken(event.target.value)}
                      placeholder="deixe vazio para usar runtime"
                      className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                      login domain (opcional)
                    </span>
                    <input
                      value={telegramLoginDomain}
                      onChange={(event) => setTelegramLoginDomain(event.target.value)}
                      placeholder="app.psique.com.br"
                      className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void connectTelegramAccount()}
                      disabled={connectingTelegram}
                      className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
                    >
                      {connectingTelegram ? "Conectando..." : "Connect Account"}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {selected.provider === "stripe" ? (
              <section className="space-y-3 rounded-xl border border-gold/30 bg-gold/10 p-4">
                <div className="space-y-1">
                  <h4 className="font-display text-2xl text-text-primary">Connect Stripe Account</h4>
                  <p className="text-sm text-text-secondary">
                    Fluxo real estilo Connect Account: valide a Secret Key no Stripe (`accounts.retrieve`) e
                    sincronize o provider com o runtime.
                  </p>
                  <p className="text-xs text-text-muted">
                    Se a chave ficar vazia, o backend usa `STRIPE_SECRET_KEY` do runtime automaticamente.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                      secret key (opcional)
                    </span>
                    <input
                      type="password"
                      value={stripeSecretKey}
                      onChange={(event) => setStripeSecretKey(event.target.value)}
                      placeholder="deixe vazio para usar runtime"
                      className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                      connect client id (opcional)
                    </span>
                    <input
                      value={stripeConnectClientId}
                      onChange={(event) => setStripeConnectClientId(event.target.value)}
                      placeholder="ca_********************************"
                      className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void connectStripeAccount()}
                      disabled={connectingStripe}
                      className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
                    >
                      {connectingStripe ? "Conectando..." : "Connect Account"}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {selected.provider === "asaas" ? (
              <section className="space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
                <div className="space-y-1">
                  <h4 className="font-display text-2xl text-text-primary">Connect Asaas Account</h4>
                  <p className="text-sm text-text-secondary">
                    Fluxo real estilo Connect Account: valide a API key no Asaas (`/v3/myAccount`) e sincronize o
                    provider com o runtime.
                  </p>
                  <p className="text-xs text-text-muted">
                    Se o campo ficar vazio, o backend usa a chave do runtime automaticamente.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                      api key (opcional)
                    </span>
                    <input
                      type="password"
                      value={asaasApiKey}
                      onChange={(event) => setAsaasApiKey(event.target.value)}
                      placeholder="deixe vazio para usar runtime"
                      className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                    />
                  </label>

                  <div className="flex items-end md:col-span-2">
                    <button
                      type="button"
                      onClick={() => void connectAsaasAccount()}
                      disabled={connectingAsaas}
                      className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
                    >
                      {connectingAsaas ? "Conectando..." : "Connect Account"}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as IntegrationStatus)}
                className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="invalid">invalid</option>
                <option value="draft">draft</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">public_config_json</span>
              <textarea
                value={publicConfigJson}
                onChange={(event) => setPublicConfigJson(event.target.value)}
                rows={12}
                className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                  secret_ref (write only)
                </span>
                <input
                  value={secretRef}
                  onChange={(event) => setSecretRef(event.target.value)}
                  placeholder="vault://provider/key"
                  className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">last_validated_at</span>
                <input
                  type="datetime-local"
                  value={lastValidatedAt}
                  onChange={(event) => setLastValidatedAt(event.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || connectingTelegram || connectingStripe || connectingAsaas || syncingRuntime}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar integração"}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Recarregar
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
