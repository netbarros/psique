import Link from "next/link";

const cards = [
  {
    title: "Planos",
    description: "Gerencie versões draft/published do catálogo comercial.",
    href: "/admin/plans",
  },
  {
    title: "Conteúdo Público",
    description: "Edite landing, pricing, checkout e copy institucional sem deploy.",
    href: "/admin/content",
  },
  {
    title: "Integrações",
    description: "Controle configuração global de provedores com trilha de auditoria.",
    href: "/admin/integrations",
  },
  {
    title: "Auditoria",
    description: "Visualize eventos administrativos e diffs de alteração.",
    href: "/admin/audit",
  },
];

export default function AdminHomePage() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <article key={card.href} className="rounded-2xl border border-border-subtle bg-surface p-6">
          <h2 className="font-display text-3xl text-text-primary">{card.title}</h2>
          <p className="mt-2 text-sm text-text-secondary">{card.description}</p>
          <Link
            href={card.href}
            className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover"
          >
            Abrir módulo
          </Link>
        </article>
      ))}
    </section>
  );
}
