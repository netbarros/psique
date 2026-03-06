import { IntegrationsAdminClient } from "@/components/admin/integrations/IntegrationsAdminClient";

export default function AdminIntegrationsPage() {
  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border-subtle bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] text-gold">platform connectivity</p>
        <h2 className="mt-1 font-display text-4xl text-text-primary md:text-5xl">Integrações Globais</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Configure status operacional e `publicConfig` por provider sem expor segredos. Atualizações são auditáveis e
          restritas ao domínio `master_admin`.
        </p>
      </header>
      <IntegrationsAdminClient />
    </section>
  );
}
