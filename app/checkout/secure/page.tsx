import type { Metadata } from "next";
import Link from "next/link";
import { getContentSection, getPublicContent, getPublicPlans } from "@/lib/frontend/public-catalog-client";
import { getDefaultPublicPlans, mapCheckoutContent, mapPublicPlan } from "@/lib/frontend/content-mappers";

export const metadata: Metadata = {
  title: "Secure Checkout | Psique",
  description: "Checkout público dinâmico gerenciado por master_admin.",
};

type SecureCheckoutPageProps = {
  searchParams?: Promise<{
    plan?: string;
  }>;
};

export default async function SecureCheckoutPage({ searchParams }: SecureCheckoutPageProps) {
  const resolvedSearch = (await searchParams) ?? {};
  const selectedPlanKey = resolvedSearch.plan?.trim() ?? "";

  const [plansRaw, contentRaw] = await Promise.all([
    getPublicPlans("pt-BR").catch(() => []),
    getPublicContent("checkout_secure", "pt-BR").catch(() => null),
  ]);

  const plans = plansRaw.length > 0 ? plansRaw.map(mapPublicPlan) : getDefaultPublicPlans();
  const selectedPlan = plans.find((plan) => plan.planKey === selectedPlanKey) ?? plans[0] ?? null;

  const contentSection = contentRaw ? getContentSection(contentRaw, "main") : null;
  const content = mapCheckoutContent(contentSection);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-bg-base pt-8 pb-12 px-4 relative overflow-x-hidden text-text-primary font-sans selection:bg-brand selection:text-bg-base">
      <header className="w-full max-w-md mx-auto flex items-center justify-between mb-8 z-10">
        <Link
          href="/pricing"
          className="w-10 h-10 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-brand">lock</span>
          <span className="text-xs uppercase tracking-widest text-text-secondary font-medium">
            Checkout Seguro
          </span>
        </div>
        <div className="w-10" aria-hidden="true" />
      </header>

      <main className="w-full max-w-md mx-auto z-10 flex flex-col gap-6 pb-28">
        <section className="bg-surface rounded-2xl p-6 border border-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 rounded-full border-2 border-border-subtle bg-bg-elevated flex items-center justify-center shrink-0">
              <span className="font-display text-2xl text-brand font-light">Ψ</span>
            </div>
            <div>
              <h2 className="text-xl text-text-primary font-display font-bold leading-tight mb-1">
                {selectedPlan?.name ?? content.title}
              </h2>
              <p className="text-text-muted text-sm">{selectedPlan?.description ?? content.subtitle}</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center text-brand">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-0.5">Início</p>
                  <p className="text-text-primary text-sm font-medium">Imediato após ativação</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center text-brand">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-0.5">Ciclo</p>
                  <p className="text-text-primary text-sm font-medium">{selectedPlan?.intervalLabel ?? "Renovação Mensal"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border-subtle flex items-center justify-between relative z-10">
            <span className="text-text-secondary text-sm">Total Hoje</span>
            <span className="text-2xl font-display font-bold text-text-primary">{selectedPlan?.amountFormatted ?? "R$ 0,00"}</span>
          </div>
        </section>

        <section className="space-y-4 mt-2 mb-4">
          <h3 className="text-lg font-display font-bold text-text-primary mb-4">Forma de Pagamento</h3>
          
          <label className="block relative cursor-pointer group">
            <input type="radio" value="card" name="payment_method" defaultChecked className="peer sr-only" />
            <div className="w-full bg-surface border border-border-subtle rounded-xl p-4 flex items-center justify-between transition-all peer-checked:border-brand peer-checked:bg-brand/5 hover:border-brand-hover/50">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-border-strong relative peer-checked:border-brand flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-primary font-medium">Cartão de Crédito</span>
                  <span className="text-text-muted text-xs">Processado via Stripe</span>
                </div>
              </div>
              <div className="flex gap-1.5 opacity-60 text-text-primary">
                <span className="material-symbols-outlined text-[24px]">credit_card</span>
              </div>
            </div>
            
            <div className="hidden peer-checked:block mt-2 bg-bg-elevated rounded-xl p-4 border border-border-subtle animate-[fadeIn_0.2s_ease-out]">
              <div className="space-y-3">
                <div>
                  <label className="text-text-muted text-xs mb-1 block">Número do Cartão</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-text-muted/50 font-mono"
                      placeholder="0000 0000 0000 0000"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">credit_card</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-text-muted text-xs mb-1 block">Validade</label>
                    <input
                      type="text"
                      className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-text-muted/50 font-mono"
                      placeholder="MM/AA"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-text-muted text-xs mb-1 block">CVC</label>
                    <input
                      type="password"
                      className="w-full bg-bg-base border border-border-subtle rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-text-muted/50 font-mono"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label className="block relative cursor-pointer group">
            <input type="radio" value="pix" name="payment_method" className="peer sr-only" />
            <div className="w-full bg-surface border border-border-subtle rounded-xl p-4 flex items-center justify-between transition-all peer-checked:border-brand peer-checked:bg-brand/5 hover:border-brand-hover/50">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full border-2 border-border-strong relative flex items-center justify-center peer-checked:border-brand">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <div className="flex flex-col">
                  <span className="text-text-primary font-medium">PIX</span>
                  <span className="text-text-muted text-xs">Liberação imediata</span>
                </div>
              </div>
              <div className="opacity-60 text-brand">
                <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
              </div>
            </div>
          </label>
        </section>

        <div className="flex items-center justify-center gap-6 py-4 opacity-50 mt-4">
          {content.trustBadges?.map((badge, idx) => (
            <div key={`badge-${idx}`} className="flex items-center gap-1.5 text-text-secondary text-xs">
              <span className="material-symbols-outlined text-[16px]">{idx === 0 ? "lock" : "gpp_good"}</span>
              {badge}
            </div>
          ))}
          {!content.trustBadges?.length && (
            <>
              <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                256-bit Encryption
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                <span className="material-symbols-outlined text-[16px]">gpp_good</span>
                LGPD Compliant
              </div>
            </>
          )}
        </div>
      </main>

      {/* STITCH Fixed Bottom CTA with gradient */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-bg-base via-bg-base to-transparent z-20 pb-8 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Link
            href={selectedPlan?.ctaHref ?? `/auth/register?plan=${selectedPlanKey}`}
            className="w-full bg-brand hover:bg-brand-hover text-bg-base font-semibold py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(82,183,136,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {selectedPlan?.ctaLabel ?? `Pagar ${selectedPlan?.amountFormatted ?? "agora"}`}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
          <p className="text-center text-[10px] text-text-muted mt-3">
            Ao confirmar, você concorda com nossos Termos de Serviço
          </p>
        </div>
      </div>
    </div>
  );
}
