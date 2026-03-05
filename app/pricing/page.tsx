import type { Metadata } from "next";
import Link from "next/link";
import { getContentSection, getPublicContent, getPublicPlans } from "@/lib/frontend/public-catalog-client";
import { getDefaultPublicPlans, mapPricingContent, mapPublicPlan } from "@/lib/frontend/content-mappers";

export const metadata: Metadata = {
  title: "Planos & Preços | Psique",
  description: "O investimento na sua excelência clínica. Plataforma premium para a prática psicanalítica.",
};

export default async function PricingPage() {
  const [plansRaw, contentRaw] = await Promise.all([
    getPublicPlans("pt-BR").catch(() => []),
    getPublicContent("pricing", "pt-BR").catch(() => null),
  ]);

  const contentSection = contentRaw ? getContentSection(contentRaw, "main") : null;
  const content = mapPricingContent(contentSection);

  const sortRank: Record<string, number> = { solo: 1, pro: 2 };
  const plans = (plansRaw.length > 0 ? plansRaw.map(mapPublicPlan) : getDefaultPublicPlans())
    .sort((a, b) => (sortRank[a.planKey] ?? 99) - (sortRank[b.planKey] ?? 99));

  const planSolo = plans[0];
  const planPro = plans[1];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col selection:bg-brand selection:text-bg-base">
      
      {/* ═══════ HEADER S13 ═══════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base/90 backdrop-blur-md border-b border-border-subtle">
        <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-brand">psychology</span>
            <span className="font-display font-bold text-xl tracking-wider text-text-primary uppercase">PSIQUE</span>
          </Link>
          <Link href="/auth/login" className="text-sm text-text-secondary transition-colors hover:text-brand">Entrar</Link>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT S13 ═══════ */}
      <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto self-center w-full grow">
        <section className="text-center mb-12">
          <span className="inline-block py-1 px-3 rounded-full border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase mb-4 bg-gold/10">Catálogo Publicado</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary leading-tight font-display">{content.title}</h1>
          <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">{content.subtitle}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
          
          {/* Card: Analista Solo */}
          {planSolo && (
            <div className="bg-surface border border-border-subtle rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-text-primary">person</span>
              </div>
              
              <div className="mb-6 z-10">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-1">{planSolo.name}</h2>
                <p className="text-text-muted text-sm">{planSolo.description}</p>
                {planSolo.headline && <p className="mt-2 text-sm text-gold font-medium">{planSolo.headline}</p>}
              </div>
              
              <div className="mb-6 z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-text-primary tracking-tight">{planSolo.amountFormatted}</span>
                  <span className="text-text-muted text-sm pb-1">{planSolo.intervalLabel}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1 z-10 text-sm">
                {planSolo.features.map((feature, i) => (
                  <li key={`solo-feat-${i}`} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={planSolo.ctaHref} className="w-full py-3.5 px-4 bg-border-subtle hover:bg-border-subtle/80 text-text-primary rounded-lg font-medium transition-colors border border-border-subtle z-10 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 flex justify-center text-center">
                {planSolo.ctaLabel}
              </Link>
            </div>
          )}

          {/* Card: Clínica Pro */}
          {planPro && (
            <div className="bg-bg-elevated border border-brand/50 rounded-2xl p-6 relative overflow-hidden flex flex-col h-full shadow-[0_0_30px_rgba(82,183,136,0.1)]">
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand to-brand-hover"></div>
              <div className="absolute top-4 right-4 bg-brand/20 text-brand text-xs font-bold px-2.5 py-1 rounded-full border border-brand/30 uppercase tracking-wide z-10">
                Recomendado
              </div>
              
              <div className="mb-6 z-10 pt-2">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-1">{planPro.name}</h2>
                <p className="text-text-muted text-sm">{planPro.description}</p>
                {planPro.headline && <p className="mt-2 text-sm text-brand font-medium">{planPro.headline}</p>}
              </div>
              
              <div className="mb-6 z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-text-primary tracking-tight">{planPro.amountFormatted}</span>
                  <span className="text-text-muted text-sm pb-1">{planPro.intervalLabel}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1 z-10 text-sm">
                {planPro.features.map((feature, i) => (
                  <li key={`pro-feat-${i}`} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={planPro.ctaHref} className="w-full py-3.5 px-4 bg-brand hover:bg-brand-hover text-bg-base rounded-lg font-semibold transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 shadow-[0_4px_14px_rgba(82,183,136,0.3)] flex justify-center text-center">
                {planPro.ctaLabel}
              </Link>
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-border-subtle max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <span className="material-symbols-outlined text-gold">shield_lock</span>
              <span>100% Compatível com <strong className="text-text-primary">LGPD</strong></span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <span className="material-symbols-outlined text-blue-400">payments</span>
              <span>Pagamentos seguros via <strong className="text-text-primary">Stripe</strong></span>
            </div>
          </div>
        </div>

        {content.faq.length > 0 && (
          <section className="mt-16 max-w-2xl mx-auto">
            <h3 className="font-display text-2xl font-bold text-center mb-8 text-text-primary">Dúvidas Frequentes</h3>
            <div className="space-y-4">
              {content.faq.map((item) => (
                <div key={item.id} className="bg-surface border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors group cursor-pointer">
                  <h4 className="font-semibold text-text-primary mb-2 flex justify-between items-center group-hover:text-brand transition-colors">
                    {item.q}
                    <span className="material-symbols-outlined text-text-muted text-sm transition-transform group-hover:rotate-180">expand_more</span>
                  </h4>
                  <p className="text-text-muted text-sm leading-relaxed hidden group-hover:block transition-all">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 text-center pb-8">
          <p className="text-text-muted text-sm mb-4">Ainda tem dúvidas sobre qual plano escolher?</p>
          <a className="inline-flex items-center gap-2 text-brand hover:text-brand-hover text-sm font-medium transition-colors" href="#">
            Falar com consultor via WhatsApp
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </main>

    </div>
  );
}
