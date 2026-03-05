"use client";

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
  const openRouterValue = initialOpenRouter ?? "";
  const telegramValue = initialTelegram ?? "";
  const stripeValue = initialStripe ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
        Escrita em integrações neste painel foi desativada por contrato. O fluxo oficial de atualização agora é
        <span className="ml-1 font-semibold">/api/admin/integrations/*</span> (somente <span className="font-semibold">master_admin</span>).
      </div>

      <IntegrationItem
        id="openrouter"
        name="OpenRouter (IA / LLM)"
        description={`Modelo ativo: ${aiModel ?? "Não definido"}`}
        connected={Boolean(openRouterValue)}
        value={openRouterValue}
        placeholder="Gerenciado pelo master_admin"
        type="password"
      />

      <IntegrationItem
        id="telegram"
        name="Telegram Bot"
        description="Token do bot"
        connected={Boolean(telegramValue)}
        value={telegramValue}
        placeholder="Gerenciado pelo master_admin"
        type="password"
      />

      <IntegrationItem
        id="stripe"
        name="Stripe Connect"
        description="Conta de recebimentos"
        connected={Boolean(stripeValue)}
        value={stripeValue}
        placeholder="Gerenciado pelo master_admin"
        type="text"
      />
    </div>
  );
}

function IntegrationItem({
  id,
  name,
  description,
  connected,
  value,
  placeholder,
  type,
}: {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  value: string;
  placeholder: string;
  type: string;
}) {
  return (
    <div id={`integracao-${id}`} className="flex flex-col gap-3 border-b border-border-subtle py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-medium text-text-primary">{name}</div>
          <div className="mt-0.5 text-[12px] text-text-muted">{description}</div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium ${
            connected
              ? "border-[rgba(82,183,136,.3)] bg-[rgba(82,183,136,.12)] text-brand"
              : "border-error/30 bg-error/12 text-error"
          }`}
        >
          <span className={`h-[5px] w-[5px] rounded-full ${connected ? "bg-brand" : "bg-error"}`} />
          {connected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      <input
        type={type}
        value={value}
        readOnly
        disabled
        placeholder={placeholder}
        className="scheme-dark w-full rounded-lg border border-border-subtle bg-bg-base px-3.5 py-2.5 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-border-strong"
        data-theme="dark"
      />
    </div>
  );
}
