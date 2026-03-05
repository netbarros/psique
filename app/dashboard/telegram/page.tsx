import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import TelegramAutomations from "@/components/dashboard/TelegramAutomations";
import { TelegramWelcomeEditor } from "@/components/dashboard/TelegramWelcomeEditor";

export const metadata: Metadata = { title: "Telegram Hub" };

export default async function TelegramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, slug, telegram_bot_token, telegram_bot_username")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  const { data: config } = await supabase
    .from("telegram_configs")
    .select("welcome_msg, automations")
    .eq("therapist_id", therapist.id)
    .single();

  const isBotActive = Boolean(therapist.telegram_bot_token);
  const botHandle = therapist.telegram_bot_username ? `@${therapist.telegram_bot_username}` : "@SeuBot";
  const publicLink = therapist.telegram_bot_username
    ? `t.me/${therapist.telegram_bot_username}?start=${therapist.slug}`
    : `t.me/PsiqueClinicBot?start=${therapist.slug}`;
  const automations = (config?.automations ?? {}) as Record<string, boolean>;
  const welcomeMessage =
    config?.welcome_msg?.trim() ||
    "Olá! Sou a assistente virtual da clínica.\nPosso ajudar com agendamentos, lembretes e pagamentos.\nComo posso ajudar você hoje?";

  return (
    <div className="relative mx-auto w-full max-w-md px-4 pb-28 pt-6 sm:max-w-2xl sm:px-6 lg:max-w-3xl lg:px-8">
      <header className="mb-6 flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-text-secondary transition-colors hover:border-border-subtle hover:bg-bg-elevated"
            aria-label="Voltar para dashboard"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold text-text-primary">
              Telegram Hub
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-brand">
              <span className={`h-1.5 w-1.5 rounded-full ${isBotActive ? "animate-pulse bg-brand" : "bg-[var(--text-muted)]"}`} />
              {isBotActive ? "Bot Online" : "Bot Offline"}
            </p>
          </div>
        </div>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary">
          <span className="material-symbols-outlined text-lg">save</span>
        </span>
      </header>

      <main className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-5">
          <span className="pointer-events-none absolute -right-4 -top-2 text-[7rem] leading-none text-text-primary opacity-[0.05]">
            ✈
          </span>
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-medium text-text-primary">
                  {botHandle}
                </h2>
                <p className="mt-1 text-sm text-text-muted">Conectado ao fluxo de lembretes e pagamentos</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  isBotActive
                    ? "border-brand/20 bg-brand/10 text-brand"
                    : "border-border-strong bg-bg-elevated text-text-muted"
                }`}
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {isBotActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Public Booking Link
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated p-2">
                <span className="material-symbols-outlined rounded-md bg-bg-base p-1.5 text-sm text-sky-300">
                  link
                </span>
                <span className="flex-1 truncate font-mono text-sm text-text-secondary">{publicLink}</span>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-gold transition-colors hover:bg-gold/10"
                  aria-label="Copiar link público"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="flex items-center gap-2 font-display text-xl text-text-primary">
            <span className="material-symbols-outlined text-gold">notifications_active</span>
            Automated Reminders
          </h3>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            <TelegramAutomations initialAutomations={automations} />
          </div>
        </section>

        <TelegramWelcomeEditor therapistId={therapist.id} initialMessage={welcomeMessage} />
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-bg-base via-bg-base to-transparent px-4 pb-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <a
            href={isBotActive && therapist.telegram_bot_username ? `https://t.me/${therapist.telegram_bot_username}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`pointer-events-auto inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-colors ${
              isBotActive
                ? "bg-brand text-bg-base shadow-[0_0_15px_rgba(82,183,136,0.3)] hover:bg-brand-hover"
                : "cursor-not-allowed bg-border-strong text-text-muted"
            }`}
            aria-disabled={!isBotActive}
          >
            <span className="material-symbols-outlined">send</span>
            Test in Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
