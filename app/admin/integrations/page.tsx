import { IntegrationsAdminClient } from "@/components/admin/integrations/IntegrationsAdminClient";

export default function AdminIntegrationsPage() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-4xl text-text-primary">Integrações Globais</h2>
        <p className="text-sm text-text-secondary">
          Atualize status e `publicConfig` por provider, sem expor segredos em leitura.
        </p>
      </header>
      <IntegrationsAdminClient />
    </section>
  );
}
