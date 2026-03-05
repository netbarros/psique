import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Planos & Preços | Psique",
  description: "O investimento na sua excelência clínica. Plataforma premium para a prática psicanalítica.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col selection:bg-brand selection:text-bg-base">
      
      {/* ═══════ HEADER S13 ═══════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base/90 backdrop-blur-md border-b border-border-subtle">
        <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined text-brand">psychology</span>
            <span className="font-display font-bold text-xl tracking-wider text-text-primary uppercase">PSIQUE</span>
          </Link>
          <Link href="/auth/login" className="material-symbols-outlined text-text-secondary hover:text-brand transition-colors">login</Link>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT S13 ═══════ */}
      <main className="pt-24 pb-20 px-4 max-w-md mx-auto self-center w-full grow">
        <section className="text-center mb-12">
          <span className="inline-block py-1 px-3 rounded-full border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase mb-4 bg-gold/10">Planos &amp; Preços</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary leading-tight font-display">O investimento na sua excelência clínica</h1>
          <p className="text-text-secondary text-base md:text-lg">Plataforma premium desenhada exclusivamente para a prática psicanalítica de alto nível.</p>
        </section>

        <div className="space-y-6">
          
          {/* Card: Analista Solo */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl text-text-primary">person</span>
            </div>
            
            <div className="mb-6 z-10">
              <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Acesso Seguro <span className="font-display text-(--tw-text-primary)">PSIQUE</span> Solo</h2>
              <p className="text-text-muted text-sm">Para o profissional independente focado em qualidade.</p>
            </div>
            
            <div className="mb-6 z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-lg text-text-secondary font-medium">R$</span>
                <span className="text-4xl font-bold text-text-primary tracking-tight">297</span>
                <span className="text-text-muted text-sm">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1 z-10 text-sm">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Agenda inteligente ilimitada</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Videochamadas HD nativas</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Bot do Telegram (Atendente virtual)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">100 Resumos de IA /mês (Claude 3.5)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Prontuário eletrônico LGPD</span>
              </li>
            </ul>
            
            <Link href="/auth/register?plan=solo" className="w-full py-3.5 px-4 bg-border-subtle hover:bg-border-subtle/80 text-text-primary rounded-lg font-medium transition-colors border border-border-subtle z-10 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 flex justify-center text-center">
              Assinar Agora
            </Link>
          </div>

          {/* Card: Clínica Pro */}
          <div className="bg-bg-elevated border border-brand/50 rounded-2xl p-6 relative overflow-hidden flex flex-col h-full shadow-[0_0_30px_rgba(82,183,136,0.1)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand to-brand-hover"></div>
            <div className="absolute top-4 right-4 bg-brand/20 text-brand text-xs font-bold px-2.5 py-1 rounded-full border border-brand/30 uppercase tracking-wide z-10">
              Recomendado
            </div>
            
            <div className="mb-6 z-10 pt-2">
              <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Clínica Pro</h2>
              <p className="text-text-muted text-sm">Escala e automação total para sua carteira.</p>
            </div>
            
            <div className="mb-6 z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-lg text-text-secondary font-medium">R$</span>
                <span className="text-4xl font-bold text-text-primary tracking-tight">497</span>
                <span className="text-text-muted text-sm">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1 z-10 text-sm">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-primary">Tudo do plano Solo, mais:</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Resumos de IA Ilimitados</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Transcrição de áudio Gemini Pro</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Automação de cobrança via Stripe</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand text-lg shrink-0">check_circle</span>
                <span className="text-text-secondary">Dashboards financeiros avançados</span>
              </li>
            </ul>
            
            <Link href="/auth/register?plan=pro" className="w-full py-3.5 px-4 bg-brand hover:bg-brand-hover text-bg-base rounded-lg font-semibold transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 shadow-[0_4px_14px_rgba(82,183,136,0.3)] flex justify-center text-center">
              Assinar Clínica Pro
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border-subtle">
          <div className="flex flex-col items-center justify-center gap-6">
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

        <section className="mt-16">
          <h3 className="font-display text-2xl font-bold text-center mb-8 text-text-primary">Dúvidas Frequentes</h3>
          <div className="space-y-4">
            
            <div className="bg-surface border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors group cursor-pointer">
              <h4 className="font-semibold text-text-primary mb-2 flex justify-between items-center group-hover:text-brand transition-colors">
                Posso cancelar quando quiser?
                <span className="material-symbols-outlined text-text-muted text-sm transition-transform group-hover:rotate-180">expand_more</span>
              </h4>
              <p className="text-text-muted text-sm leading-relaxed hidden group-hover:block transition-all">
                Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento e continuará tendo acesso até o fim do período já pago.
              </p>
            </div>
            
            <div className="bg-surface border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors group cursor-pointer">
              <h4 className="font-semibold text-text-primary mb-2 flex justify-between items-center group-hover:text-brand transition-colors">
                Meus dados estão seguros?
                <span className="material-symbols-outlined text-text-muted text-sm transition-transform group-hover:rotate-180">expand_more</span>
              </h4>
              <p className="text-text-muted text-sm leading-relaxed hidden group-hover:block transition-all">
                Absolutamente. O PSIQUE utiliza criptografia de ponta a ponta para dados sensíveis e atende a todos os requisitos da LGPD brasileira para prontuários eletrônicos.
              </p>
            </div>
            
            <div className="bg-surface border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors group cursor-pointer">
              <h4 className="font-semibold text-text-primary mb-2 flex justify-between items-center group-hover:text-brand transition-colors">
                Como funciona a IA nas sessões?
                <span className="material-symbols-outlined text-text-muted text-sm transition-transform group-hover:rotate-180">expand_more</span>
              </h4>
              <p className="text-text-muted text-sm leading-relaxed hidden group-hover:block transition-all">
                A IA atua como um assistente de copilotagem. Ela pode transcrever, resumir notas brutas e sugerir insights com base no histórico, operando sempre sob um rígido prompt clínico ético (Claude 3.5 Sonnet).
              </p>
            </div>

          </div>
        </section>

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
