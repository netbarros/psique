import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ModuleCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  points: string[];
};

type MetricCard = {
  label: string;
  value: number;
  icon: string;
  accent: "brand" | "gold" | "blue";
};

const modules: ModuleCard[] = [
  {
    title: "Planos",
    description: "Versionamento completo de pricing com fluxo draft -> published.",
    href: "/admin/plans",
    icon: "sell",
    points: ["Controle de revisão por ETag", "Publish com If-Match obrigatório"],
  },
  {
    title: "Conteúdo Público",
    description: "Gestão editorial por pageKey/sectionKey/locale sem deploy.",
    href: "/admin/content",
    icon: "article",
    points: ["Landing, pricing e checkout", "Conflito de publicação com 409/428"],
  },
  {
    title: "Integrações",
    description: "Configuração global de providers com visibilidade de status.",
    href: "/admin/integrations",
    icon: "hub",
    points: ["Sem exposição de segredo na leitura", "Atualização centralizada por provider"],
  },
  {
    title: "Auditoria",
    description: "Trilha imutável de ações administrativas e diffs operacionais.",
    href: "/admin/audit",
    icon: "history",
    points: ["Timeline por ator e recurso", "Rastreabilidade de publish e patch"],
  },
];

function Metric({ item }: { item: MetricCard }) {
  const accentClass =
    item.accent === "gold"
      ? "text-gold bg-gold/10 border-gold/20"
      : item.accent === "blue"
        ? "text-blue bg-blue/10 border-blue/20"
        : "text-brand bg-brand/10 border-brand/20";

  return (
    <article className="rounded-2xl border border-border-subtle bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{item.label}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${accentClass}`}>
          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
        </span>
      </div>
      <p className="font-display text-4xl leading-none text-text-primary">{item.value}</p>
    </article>
  );
}

export default async function AdminHomePage() {
  const supabase = await createClient();
  const last24hDate = new Date();
  last24hDate.setHours(last24hDate.getHours() - 24);
  const last24h = last24hDate.toISOString();

  const [
    draftPlansResult,
    publishedPlansResult,
    draftContentResult,
    publishedContentResult,
    activeIntegrationsResult,
    events24hResult,
    recentEventsResult,
  ] = await Promise.all([
    supabase.from("plan_revisions").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("plan_revisions").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("content_revisions").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("content_revisions").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("platform_integrations").select("provider", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("admin_audit_events").select("id", { count: "exact", head: true }).gte("created_at", last24h),
    supabase
      .from("admin_audit_events")
      .select("id, action, resource_type, resource_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const metrics: MetricCard[] = [
    { label: "Planos Publicados", value: publishedPlansResult.count ?? 0, icon: "done_all", accent: "brand" },
    { label: "Planos em Draft", value: draftPlansResult.count ?? 0, icon: "edit_square", accent: "gold" },
    { label: "Conteúdo Publicado", value: publishedContentResult.count ?? 0, icon: "public", accent: "blue" },
    { label: "Conteúdo em Draft", value: draftContentResult.count ?? 0, icon: "draft", accent: "gold" },
    { label: "Integrações Ativas", value: activeIntegrationsResult.count ?? 0, icon: "hub", accent: "brand" },
    { label: "Eventos (24h)", value: events24hResult.count ?? 0, icon: "monitoring", accent: "blue" },
  ];

  const recentEvents = recentEventsResult.data ?? [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-brand/25 bg-linear-to-br from-bg-elevated to-surface p-6">
        <div className="pointer-events-none absolute -right-10 -top-8 h-36 w-36 rounded-full bg-brand/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">
              <span className="material-symbols-outlined text-[12px]">shield_lock</span>
              Master Admin Control
            </p>
            <h2 className="font-display text-4xl leading-tight text-text-primary md:text-5xl">
              Operação editorial e governança em um único painel.
            </h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              Fluxo completo para patch/publish com concorrência otimista, observabilidade de integrações e trilha
              auditável de alterações.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/plans"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-bg-base transition-all hover:bg-brand-hover"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Publicar plano
            </Link>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-brand/30 hover:text-brand"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar conteúdo
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((item) => (
          <Metric key={item.label} item={item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <article
              key={module.href}
              className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30"
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-display text-3xl leading-tight text-text-primary">{module.title}</h3>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand">
                  <span className="material-symbols-outlined text-[18px]">{module.icon}</span>
                </span>
              </div>
              <p className="text-sm text-text-secondary">{module.description}</p>
              <ul className="mt-4 space-y-2 text-xs text-text-muted">
                {module.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={module.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-hover"
              >
                Abrir módulo
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </article>
          ))}
        </div>

        <aside className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-3xl text-text-primary">Atividade Recente</h3>
            <Link
              href="/admin/audit"
              className="text-xs uppercase tracking-wider text-brand transition-colors hover:text-brand-hover"
            >
              Ver auditoria
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-bg-elevated p-4 text-sm text-text-muted">
              Nenhum evento administrativo registrado nas últimas operações.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <article key={event.id} className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">{event.resource_type}</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{event.action}</p>
                  <p className="mt-1 text-xs text-text-secondary break-all">{event.resource_id}</p>
                  <p className="mt-2 text-[11px] text-brand">
                    {new Date(event.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </article>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-gold/25 bg-gold/10 p-4">
            <p className="text-[11px] uppercase tracking-wider text-gold">Checklist de Publicação</p>
            <ul className="mt-2 space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" />
                Recarregar revisão ao receber conflito `409`.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" />
                Enviar `If-Match` obrigatório em publish (`428` quando ausente).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" />
                Validar reflexo no catálogo público após publicação.
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
