import { PlansAdminClient } from "@/components/admin/plans/PlansAdminClient";

export default function AdminPlansPage() {
  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border-subtle bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] text-gold">pricing governance</p>
        <h2 className="mt-1 font-display text-4xl text-text-primary md:text-5xl">Gestão de Planos</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Fluxo editorial completo: criação de draft, patch com controle de ETag, diff contra versão publicada e
          publish com `If-Match` obrigatório.
        </p>
      </header>
      <PlansAdminClient />
    </section>
  );
}
