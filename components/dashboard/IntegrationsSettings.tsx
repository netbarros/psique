"use client";

import { useState } from "react";
import { toast } from "@/components/ui/Toast";

interface Props {
  initialOpenRouter?: string | null;
  initialTelegram?: string | null;
  initialStripe?: string | null;
  aiModel?: string | null;
}

export default function IntegrationsSettings({
  initialOpenRouter,
  initialTelegram,
  initialStripe,
  aiModel,
}: Props) {
  const [openRouterKey, setOpenRouterKey] = useState(initialOpenRouter ?? "");
  const [telegramToken, setTelegramToken] = useState(initialTelegram ?? "");
  const [stripeAccount, setStripeAccount] = useState(initialStripe ?? "");
  const [saving, setSaving] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);

  const openRouterConnected = Boolean(openRouterKey);

  const saveIntegrations = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openRouterKey: openRouterKey.trim() || null,
          telegramToken: telegramToken.trim() || null,
          stripeAccountId: stripeAccount.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: {
          stripeAccountId?: string | null;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao salvar integrações");
      }

      if (payload.data?.stripeAccountId) {
        setStripeAccount(payload.data.stripeAccountId);
      }

      toast.success("Integrações validadas e atualizadas com sucesso!");
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message ?? "Erro ao salvar integrações");
    } finally {
      setSaving(false);
    }
  };

  const connectStripe = async () => {
    if (stripeConnecting) return;
    setStripeConnecting(true);
    try {
      const response = await fetch("/api/settings/integrations/stripe/connect", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: { url?: string; accountId?: string };
      };

      if (!response.ok || !payload.data?.url) {
        throw new Error(payload.error ?? "Falha ao iniciar Stripe Connect");
      }

      if (payload.data.accountId) {
        setStripeAccount(payload.data.accountId);
      }

      window.location.assign(payload.data.url);
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message ?? "Falha ao conectar Stripe");
    } finally {
      setStripeConnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <IntegrationItem
        id="openrouter"
        name="OpenRouter (IA / LLM)"
        description={`Modelo ativo: ${aiModel ?? "Não definido"}`}
        connected={openRouterConnected}
        value={openRouterKey}
        onChange={setOpenRouterKey}
        placeholder="Opcional (usa a chave padrão da plataforma Psique)"
        type="password"
      />

      <IntegrationItem
        id="telegram"
        name="Telegram Bot"
        description="Token do seu bot gerado via @BotFather"
        connected={Boolean(telegramToken)}
        value={telegramToken}
        onChange={setTelegramToken}
        placeholder="123456789:ABCDefghIJKlmnopQRSTuvwxYZ"
        type="password"
      />

      <IntegrationItem
        id="stripe"
        name="Stripe Connect"
        description="ID da sua conta Stripe para recebimentos"
        connected={Boolean(stripeAccount)}
        value={stripeAccount}
        onChange={setStripeAccount}
        placeholder="acct_1Ou..."
        type="text"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={connectStripe}
          disabled={stripeConnecting}
          className={`rounded-xl px-4 py-2 text-[12px] font-semibold transition-all ${
            stripeConnecting
              ? "cursor-not-allowed border border-border-subtle bg-surface text-text-muted"
              : "border border-border-subtle bg-bg-base text-text-secondary hover:bg-surface hover:text-text-primary"
          }`}
        >
          {stripeConnecting ? "Conectando Stripe..." : "Conectar Stripe Express"}
        </button>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={saveIntegrations}
          disabled={saving}
          className={`rounded-xl px-6 py-2.5 text-[13px] font-semibold transition-all ${
            saving
              ? "cursor-not-allowed border border-border-subtle bg-surface text-text-muted"
              : "bg-brand text-bg-base hover:bg-brand-hover"
          }`}
        >
          {saving ? "Salvando..." : "Salvar Integrações"}
        </button>
      </div>
    </div>
  );
}

function IntegrationItem({
  id,
  name,
  description,
  connected,
  value,
  onChange,
  placeholder,
  type,
}: {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type: string;
}) {
  return (
    <div id={`integracao-${id}`} className="flex flex-col gap-3 border-b border-border-subtle py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-medium text-text-primary">
            {name}
          </div>
          <div className="mt-0.5 text-[12px] text-text-muted">
            {description}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium ${
            connected
              ? "border-[rgba(82,183,136,.3)] bg-[rgba(82,183,136,.12)] text-brand"
              : "border-error/30 bg-error/12 text-error"
          }`}
        >
          <span
            className={`h-[5px] w-[5px] rounded-full ${
              connected ? "bg-brand" : "bg-error"
            }`}
          />
          {connected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-subtle bg-bg-base px-3.5 py-2.5 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-border-strong"
      />
    </div>
  );
}
