import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getContentSection, getPublicContent } from "@/lib/frontend/public-catalog-client";
import { mapLandingContent } from "@/lib/frontend/content-mappers";

export const metadata: Metadata = {
  title: "Psique — A única plataforma que cuida de quem cuida",
  description: "Conteúdo público dinâmico gerenciado por master_admin.",
};

function pickString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export default async function LandingPage() {
  const content = await getPublicContent("landing", "pt-BR").catch(() => null);
  const section = content ? getContentSection(content, "main") : null;
  const mapped = mapLandingContent(section);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col overflow-x-hidden pb-20">
      
      {/* ═══════ NAV S11 ═══════ */}
      <nav className="fixed top-0 w-full z-50 bg-bg-base/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand text-2xl">spa</span>
          <span className="font-display font-bold tracking-widest text-lg text-text-primary uppercase">Psique</span>
        </div>
        <Link href="/auth/login" className="material-symbols-outlined text-text-primary text-2xl hover:text-brand transition-colors">login</Link>
      </nav>

      {/* ═══════ MAIN HERO S11 ═══════ */}
      <main className="grow flex flex-col relative pt-24 pb-12 px-5">
        <div className="inline-flex items-center self-center gap-2 bg-surface border border-border-subtle rounded-full px-4 py-2 mx-auto mb-8 relative z-10 shadow-lg shadow-black/50">
          <div className="flex -space-x-2">
            <Image alt="Analyst" className="w-6 h-6 rounded-full border border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxdi4b7it8cx0IbFDif2DFLkWmlOjSqoPP6tsG2Ss8uJ01JNL3EXe2lzxkBs_gpYD_rfGKborHE6vW2b8C0ClsgqpUrrSgQV2WuTItD2z-UEUCG3ycjOf61HYjYukR8WWVvebCsl_-wtzdG58CdVN5XNIEhdO2AzddGMBlwdPW6SZCsv2lUOFKCHks2HGGZ3V3myAD1O2Wr-gdoi6TMiXdCFpz72CT7xJJdrouwJl6RyEldh7hYf1FTspBzEnEFLbwilUgaNXxUrhb" width={24} height={24} />
            <Image alt="Analyst" className="w-6 h-6 rounded-full border border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRU5gjRmGWQHpzeR8KYZK0JN5zt4sZctVeX4OHi4nEGS2tmw2OF24vMcXCE7XiZDcJy1d3w8fP3RTh9sNe61wSzNztYZRU6EX_ZS54uAMXUyG5inyKURiJIhGQC3VIH1t2HvCfdk2glGK2Wlnukq8l9I2v49uFDWHFUuo1roLzo6p_6-cEoTYzO8iZDp-nhmkZuYEh44lwQ17bBIPvgO8KscMqr54QYE1UBsEeop_MCRlbXC1Tf8SmfTbgN4cZVhaT8u88YpnuYy5b" width={24} height={24} />
            <Image alt="Analyst" className="w-6 h-6 rounded-full border border-surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcaG2-0QjDwNeOlSip6JmuSi4N17KWt1pAk8TcdAViQYKM7jhq6FphT1YTWY3axGzDj5eqWWBooW6pMvCYrzNInQvQ7wgncQZURogSkxTChYJb3Lei76ADppBjVCSC4NnE0tUaDjVVRaQUJLaP83H2UGPLG2XtsuTL2F13A3z2agAc6k1d01GDDpzoCJFFWu6rATBI2aC_pu5Ji1viZvb8IsPJhbG8e-SXFMaWiM1EW_iMTLPLXt-K7sk6x1sj4SKetIX3JSsilBWe" width={24} height={24} />
          </div>
          <span className="text-xs font-medium text-text-secondary tracking-wide">Confiado por +500 Psicanalistas</span>
        </div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-medium leading-[1.1] mb-6 tracking-tight text-text-primary">
            {mapped.title}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-md mx-auto">
            {mapped.subtitle}
          </p>
          <Link href={mapped.primaryCtaHref} className="w-full max-w-xs bg-brand text-bg-base font-semibold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(82,183,136,0.3)] hover:bg-brand-hover hover:scale-[1.02] transition-all duration-300 flex justify-center items-center gap-2">
            {mapped.primaryCtaLabel}
            <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
          </Link>
          <p className="mt-4 text-xs text-text-muted">Sem cartão de crédito • Configure em 5 minutos</p>
        </div>

        <div className="mt-16 relative w-full aspect-square max-w-sm mx-auto self-center z-10">
          <div className="absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none bg-[radial-gradient(circle,rgba(82,183,136,0.15)_0%,rgba(8,15,11,0)_70%)]" />
          
          <div className="absolute inset-0 bg-linear-to-tr from-surface to-bg-elevated rounded-2xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col">
            <div className="h-10 border-b border-border-subtle flex items-center px-4 justify-between bg-bg-base/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-border-subtle"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-border-subtle"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-border-subtle"></div>
              </div>
              <span className="text-[10px] font-mono text-text-muted">psique.app/painel</span>
            </div>
            
            <div className="grow p-5 flex flex-col gap-4 relative">
              <div className="bg-bg-base/80 rounded-xl border border-border-subtle p-4 shadow-sm relative overflow-hidden backdrop-blur-sm transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <span className="material-symbols-outlined text-4xl text-brand">psychology</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-brand text-sm">auto_awesome</span>
                  <span className="text-xs font-semibold text-brand tracking-wider uppercase">Insight Clínico</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed font-display italic border-l-2 border-border-subtle pl-3">
                  &quot;Paciente demonstrou padrões de evitação ao mencionar a figura paterna. Sugere-se explorar a transferência ocorrida nos últimos 15 minutos da sessão.&quot;
                </p>
              </div>
              
              <div className="mt-auto flex items-start gap-3 rounded-xl border border-info/30 bg-info/10 p-4 shadow-sm transition-transform duration-500 rotate-1 hover:rotate-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info">
                  <span className="material-symbols-outlined text-white text-sm">send</span>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Psique Bot</p>
                  <div className="bg-surface rounded-lg rounded-tl-none px-3 py-2 border border-border-subtle">
                    <p className="text-xs text-text-primary">Sessão com Mariana confirmada para amanhã às 14h. Link de vídeo gerado e cobrança enviada. ☕</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════ HEADER S12 (Transição) ═══════ */}
      <header className="pt-16 pb-12 px-6 text-center relative overflow-hidden mt-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-brand/5 blur-[100px] rounded-full pointer-events-none"></div>
        <p className="text-gold text-sm tracking-widest uppercase mb-4 font-medium">O Ecossistema Clínico</p>
        <p className="text-text-secondary text-base max-w-md mx-auto leading-relaxed">
          PSIQUE integra IA generativa, automação e gestão clínica em uma experiência premium, desenvolvida exclusivamente para psicanalistas.
        </p>
      </header>

      {/* ═══════ FEATURES S12 ═══════ */}
      <section className="px-5 space-y-6 max-w-md mx-auto self-center relative z-10 w-full">
        {mapped.blocks[0] && (
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
            <div className="w-12 h-12 rounded-full border border-border-subtle bg-bg-elevated flex items-center justify-center mb-5 glow-mint">
              <span className="material-symbols-outlined text-brand">calendar_month</span>
            </div>
            <h3 className="text-2xl font-display mb-2 text-text-primary">
              {pickString(mapped.blocks[0]?.title, "Agenda Inteligente")}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {pickString(mapped.blocks[0]?.description, "Página pública de autoagendamento com pagamento integrado via Stripe. Reduza o atrito e capture leads 24/7.")}
            </p>
            <ul className="space-y-2 text-xs text-text-muted">
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-brand">check</span> Fuso horário automático</li>
              <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-brand">check</span> Salas de vídeo HD nativas</li>
            </ul>
          </div>
        )}

        {mapped.blocks[1] && (
          <div className="glass-card rounded-2xl p-6 border-brand/30 glow-mint relative shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="w-12 h-12 rounded-full border border-brand/50 bg-brand/10 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-brand">psychology</span>
            </div>
            <h3 className="text-2xl font-display mb-2 text-text-primary">
              {pickString(mapped.blocks[1]?.title, "IA Clínica")}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-5">
              {pickString(mapped.blocks[1]?.description, "Modelos avançados analisam suas anotações brutas e geram resumos clínicos com confidencialidade.")}
            </p>
            <div className="bg-linear-to-b from-bg-base to-bg-elevated rounded-xl p-4 border border-border-subtle shadow-inner">
              <div className="flex items-center gap-2 mb-3 border-b border-border-subtle pb-2">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                <span className="text-xs text-text-muted font-mono">Resumo Gerado • Sessão #12</span>
              </div>
              <p className="text-sm text-text-secondary italic font-display leading-relaxed mb-3">
                &quot;Paciente demonstrou ambivalência em relação à figura paterna. Insight principal: repetição de padrão de evitação...&quot;
              </p>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-base border border-border-subtle text-gold">Risco: Baixo</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-bg-base border border-border-subtle text-brand">+2 Insights</span>
              </div>
            </div>
          </div>
        )}

        {mapped.blocks[2] && (
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-info/10 blur-2xl rounded-full -ml-10 -mb-10"></div>
            <div className="w-12 h-12 rounded-full border border-border-subtle bg-bg-elevated flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-info">send</span>
            </div>
            <h3 className="text-2xl font-display mb-2 text-text-primary">
              {pickString(mapped.blocks[2]?.title, "Telegram Bot Nativo")}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {pickString(mapped.blocks[2]?.description, "O fim do WhatsApp manual. Seu bot exclusivo agenda sessões, envia lembretes e gerencia cobranças automaticamente.")}
            </p>
            <div className="bg-bg-base rounded-lg p-3 border border-border-subtle flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-brand text-[16px]">robot_2</span>
              </div>
              <div>
                <p className="text-xs text-text-secondary">⏰ Lembrete: Sessão amanhã às 16h. Link de acesso gerado.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════ POR QUE PSIQUE S12 ═══════ */}
      <section className="mt-20 px-6 max-w-md w-full mx-auto self-center">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display mb-4 text-text-primary">Por que PSIQUE?</h2>
          <p className="text-text-secondary text-sm">O fim da burocracia manual que drena sua energia clínica.</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-1">
              <span className="material-symbols-outlined text-red-400 text-[18px]">close</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Planilhas e WhatsApp</p>
              <p className="text-xs text-text-muted">Perda de leads, cancelamentos esquecidos e tempo perdido confirmando horários manualmente.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-1">
              <span className="material-symbols-outlined text-red-400 text-[18px]">close</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Prontuários de papel/Docs</p>
              <p className="text-xs text-text-muted">Anotações perdidas, risco à LGPD e zero inteligência de dados sobre a evolução do paciente.</p>
            </div>
          </div>

          <div className="mt-6 p-px rounded-xl bg-linear-to-b from-brand/40 to-transparent">
            <div className="bg-surface rounded-xl p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-brand text-[18px]">check</span>
              </div>
              <div>
                <p className="text-sm font-medium text-brand mb-1">A Solução PSIQUE</p>
                <p className="text-xs text-text-secondary leading-relaxed">Configurado em 5 minutos. Uma plataforma única que automatiza o admin e eleva a qualidade do seu atendimento.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-linear-to-t from-bg-base via-bg-base to-transparent z-50 flex justify-center pb-8 pointer-events-none">
        <Link href={mapped.secondaryCtaHref} className="pointer-events-auto w-full max-w-sm bg-brand hover:bg-brand-hover text-bg-base font-medium py-4 px-6 rounded-full shadow-[0_0_20px_rgba(82,183,136,0.3)] transition-all flex items-center justify-center gap-2">
          {mapped.secondaryCtaLabel}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
