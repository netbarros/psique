import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import IntegrationsSettings from "@/components/dashboard/IntegrationsSettings";
import TelegramAutomations from "@/components/dashboard/TelegramAutomations";
import SettingsTabs from "@/components/dashboard/SettingsTabs";

export const metadata: Metadata = { title: "Configurações — Integrações" };

export default async function IntegracoesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, openrouter_key_hash, telegram_bot_token, stripe_account_id, ai_model")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    redirect("/auth/login");
  }

  const { data: telegramConfig } = await supabase
    .from("telegram_configs")
    .select("automations")
    .eq("therapist_id", therapist.id)
    .maybeSingle();

  const automations =
    telegramConfig?.automations && typeof telegramConfig.automations === "object"
      ? (telegramConfig.automations as Record<string, boolean>)
      : {
          reminder_24h: true,
          reminder_1h: true,
          post_session_billing: true,
          nps_collection: true,
          lead_nurture: false,
          reengagement: false,
        };

  const integrations: IntegrationItem[] = [
    {
      id: "openrouter",
      name: "OpenRouter AI",
      description: "Motor clínico para geração de insights e respostas assistidas.",
      icon: <span className="material-symbols-outlined text-[20px]">electric_bolt</span>,
      connected: Boolean(therapist.openrouter_key_hash),
      actionLabel: therapist.openrouter_key_hash ? "Revalidar" : "Conectar",
    },
    {
      id: "telegram",
      name: "Telegram Bot",
      description: "Lembretes automáticos, pós-sessão e fluxo de cobrança.",
      icon: <span className="material-symbols-outlined text-[20px]">robot</span>,
      connected: Boolean(therapist.telegram_bot_token),
      actionLabel: therapist.telegram_bot_token ? "Reconectar" : "Conectar",
    },
    {
      id: "stripe",
      name: "Stripe Connect",
      description: "Pagamento, split e reconciliação financeira.",
      icon: <span className="material-symbols-outlined text-[20px]">credit_card</span>,
      connected: Boolean(therapist.stripe_account_id),
      actionLabel: therapist.stripe_account_id ? "Reautorizar" : "Conectar",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          Integrações
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Conecte serviços externos e garanta continuidade operacional da clínica.
        </p>
      </header>

      <SettingsTabs active="integracoes" />

      <div className="space-y-6">
        <section className="rounded-2xl border border-border-subtle bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl text-gold">
            <span className="material-symbols-outlined text-[20px]">cable</span>
            Serviços conectados
          </h2>
          <div className="space-y-3">
            {integrations.map((integration) => (
              <article
                key={integration.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border-subtle bg-bg-elevated p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bg-base text-text-secondary">
                    {integration.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">{integration.name}</h3>
                    <p className="mt-0.5 text-xs text-text-muted">{integration.description}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                        integration.connected
                          ? "border-brand/20 bg-brand/10 text-brand"
                          : "border-error/30 bg-error/10 text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      {integration.connected ? "Conectado" : "Desconectado"}
                    </span>
                  </div>
                </div>
                <a
                  href={`#integracao-${integration.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-base hover:text-text-primary"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  {integration.actionLabel}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface p-6">
          <h2 className="mb-4 font-display text-2xl text-gold">
            Configuração avançada
          </h2>
          <IntegrationsSettings
            initialOpenRouter={therapist.openrouter_key_hash}
            initialTelegram={therapist.telegram_bot_token}
            initialStripe={therapist.stripe_account_id}
            aiModel={therapist.ai_model}
          />
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface p-6">
          <h2 className="mb-4 font-display text-2xl text-gold">
            Automação Telegram
          </h2>
          <TelegramAutomations initialAutomations={automations} />
        </section>
      </div>
    </div>
  );
}

type IntegrationItem = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  actionLabel: string;
};
