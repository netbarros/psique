import { AuditAdminClient } from "@/components/admin/audit/AuditAdminClient";

export default function AdminAuditPage() {
  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border-subtle bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] text-gold">traceability center</p>
        <h2 className="mt-1 font-display text-4xl text-text-primary md:text-5xl">Auditoria Administrativa</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Histórico imutável das ações do domínio `master_admin`, com rastreabilidade de ator, recurso e diff
          serializado.
        </p>
      </header>
      <AuditAdminClient />
    </section>
  );
}
